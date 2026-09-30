package com.hrmsapp.reminders

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.hrmsapp.R
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Decides whether a due reminder should be shown and shows it.
 *
 * Calls GET /punch/status with the signed-in user's token:
 *   • check-in  — skipped if the user has already checked in
 *   • check-out — skipped if the user has already checked out
 *   • network error / timeout — shown anyway (safer to remind)
 *   • 401 (token expired / signed out) — skipped
 */
object ReminderWorker {
  // Must match CHANNEL_ID in src/utils/notifications.ts and firebase.json.
  const val CHANNEL_ID = "attendance-reminders-hrms"
  private val OLD_CHANNEL_IDS = listOf("attendance-reminders-custom")
  private const val TAG = "HrmsReminder"
  private const val MAX_LOG_BYTES = 64_000L
  // Keep the check short: if it runs without the foreground service, some phones
  // (Realme "Hans") freeze background apps about 10 s after they start.
  private const val TIMEOUT_MS = 4000

  private enum class Status { DONE, NOT_DONE, UNKNOWN, UNAUTHORIZED }

  /** Reminders currently being handled in this process ("type|date"). */
  private val running = mutableSetOf<String>()

  /**
   * Check the punch right away and notify only if it is still missing. Called
   * at the reminder time by [ReminderReceiver] (the alarm) or by
   * [ReminderMessagingService] (a Firebase push) — [dueAt] is the reminder's
   * scheduled time, used to key the once-per-slot guard.
   */
  fun run(context: Context, type: String, dueAt: Long) {
    val store = ReminderStore(context)
    val token = store.token
    if (!store.enabled || token.isNullOrEmpty()) {
      log(context,"$type: skipped, not signed in")
      return
    }

    // Once per scheduled reminder slot (date + time), so a changed reminder time
    // on the same day still fires, while duplicates of one slot never show twice.
    val slot = SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.US).format(Date(dueAt))
    val key = "$type|$slot"
    log(context, "$type: check started for $slot")
    synchronized(running) {
      if (store.lastShown(type) == slot || !running.add(key)) {
        log(context,"$type: skipped, already handled for $slot")
        return
      }
    }
    try {
      val status = fetchStatus(context, store.baseUrl, token, type)
      log(context,"$type: punch status $status")
      when (status) {
        Status.DONE, Status.UNAUTHORIZED -> return
        Status.NOT_DONE, Status.UNKNOWN -> show(context, store, type, slot)
      }
    } finally {
      synchronized(running) { running.remove(key) }
    }
  }

  private fun fetchStatus(context: Context, baseUrl: String, token: String, type: String): Status {
    var conn: HttpURLConnection? = null
    return try {
      conn = (URL("${baseUrl.trimEnd('/')}/punch/status").openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"
        connectTimeout = TIMEOUT_MS
        readTimeout = TIMEOUT_MS
        setRequestProperty("Accept", "application/json")
        setRequestProperty("Authorization", "Bearer $token")
      }
      val code = conn.responseCode
      log(context, "$type: HTTP $code")
      if (code == 401) return Status.UNAUTHORIZED
      if (code !in 200..299) return Status.UNKNOWN
      val body = conn.inputStream.bufferedReader().use { it.readText() }
      log(context, "$type: response ${body.take(400)}")
      val root = JSONObject(body)
      val data = root.optJSONObject("data") ?: root
      val state = text(data, "state")
      val punch = data.optJSONObject("punch")
      val checkedIn = hasTime(punch, "intime") || (state.isNotEmpty() && state != "not_punched")
      val checkedOut = hasTime(punch, "outtime") || state == "punched_out"
      val done = if (type == ReminderScheduler.TYPE_CHECKIN) checkedIn else checkedOut
      if (done) Status.DONE else Status.NOT_DONE
    } catch (e: Exception) {
      log(context, "$type: request failed ${e.javaClass.simpleName}: ${e.message}")
      Status.UNKNOWN
    } finally {
      conn?.disconnect()
    }
  }

  /**
   * Log a reminder decision to logcat and to
   * Android/data/com.hrmsapp/files/reminder-log.txt (readable over USB) — some
   * phones (Realme) hide app logcat lines, so the file is the reliable record.
   */
  private fun log(context: Context, message: String) {
    Log.w(TAG, message)
    try {
      val dir = context.getExternalFilesDir(null) ?: return
      val file = File(dir, "reminder-log.txt")
      if (file.length() > MAX_LOG_BYTES) file.writeText("")
      val ts = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(Date())
      file.appendText("$ts $message\n")
    } catch (_: Exception) {
      // logging must never break a reminder
    }
  }

  private fun text(obj: JSONObject?, key: String): String {
    if (obj == null || !obj.has(key) || obj.isNull(key)) return ""
    return obj.optString(key, "").trim()
  }

  private fun hasTime(punch: JSONObject?, key: String): Boolean {
    val v = text(punch, key)
    return v.isNotEmpty() && v != "00:00:00" && v != "00:00"
  }

  private fun show(context: Context, store: ReminderStore, type: String, slot: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      log(context,"$type: not shown, notification permission missing")
      return
    }

    val isCheckIn = type == ReminderScheduler.TYPE_CHECKIN
    val title = if (isCheckIn) "Check-in reminder" else "Check-out reminder"
    val message =
      if (isCheckIn) "You haven't checked in yet — tap to punch in."
      else "You haven't checked out yet — don't forget to punch out."

    ensureChannel(context)
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(message)
      .setStyle(NotificationCompat.BigTextStyle().bigText(message))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setAutoCancel(true)
      .setContentIntent(ReminderScheduler.openAppPendingIntent(context))
      .build()

    try {
      NotificationManagerCompat.from(context).notify(if (isCheckIn) 9301 else 9302, notification)
      log(context,"$type: reminder shown")
    } catch (_: SecurityException) {
      log(context,"$type: not shown, notification permission missing")
      return
    }

    store.markShown(type, slot)
    val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      .apply { timeZone = TimeZone.getTimeZone("UTC") }
      .format(Date())
    store.addDelivered(
      JSONObject()
        .put("id", "$type-reminder-$slot")
        .put("title", title)
        .put("message", message)
        .put("created_at", iso)
        .put("is_read", 0),
    )
  }

  /** Same channel the JS side creates (custom sound); created here if missing. */
  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java) ?: return
    OLD_CHANNEL_IDS.forEach { nm.deleteNotificationChannel(it) }
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    val sound = Uri.parse(
      "${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/raw/hrms_notification",
    )
    val channel = NotificationChannel(CHANNEL_ID, "Attendance Reminders", NotificationManager.IMPORTANCE_HIGH)
    channel.setSound(
      sound,
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build(),
    )
    nm.createNotificationChannel(channel)
  }
}
