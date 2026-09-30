package com.hrmsapp.reminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

/**
 * Schedules the daily check-in / check-out alarms with AlarmManager.
 *
 * Uses `setExactAndAllowWhileIdle` (no status-bar alarm icon, unlike
 * setAlarmClock). Some phones (Realme / Oppo / Xiaomi…) deliver it a few seconds
 * late (Realme delivers at the minute + ~10 s). It fires at the
 * reminder time and the punch is checked immediately — no waiting, so there is
 * no foreground-service notification. (A Firebase push carrying
 * `reminder=checkin|checkout`, if one is ever sent, is handled the same way by
 * [ReminderMessagingService]; a reminder is shown at most once per slot.)
 *
 * Each alarm is one-shot; [ReminderReceiver] re-arms the next day's alarm when it
 * fires, and the app re-arms both on every open, after boot and after updates.
 */
object ReminderScheduler {
  const val TYPE_CHECKIN = "checkin"
  const val TYPE_CHECKOUT = "checkout"
  const val ACTION_FIRE = "com.hrmsapp.reminders.FIRE"
  const val EXTRA_TYPE = "type"
  const val EXTRA_TARGET = "target"

  private val TYPES = listOf(TYPE_CHECKIN, TYPE_CHECKOUT)

  /** Arm both reminders, if a user is signed in. */
  fun scheduleAll(context: Context) {
    val store = ReminderStore(context)
    if (!store.enabled || store.token.isNullOrEmpty()) return
    TYPES.forEach { schedule(context, it) }
  }

  /**
   * Arm the next occurrence of one reminder strictly after [after] (today if
   * still ahead, else tomorrow). The receiver passes the target it just handled
   * so the re-armed alarm is always for the following day.
   */
  fun schedule(context: Context, type: String, after: Long = System.currentTimeMillis()) {
    val store = ReminderStore(context)
    if (!store.enabled) return
    val at = nextTarget(store.hour(type), store.minute(type), after)
    val am = context.getSystemService(AlarmManager::class.java) ?: return
    val operation = firePendingIntent(context, type, at)
    try {
      if (canUseExact(am)) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
      } else {
        // Exact alarms not allowed on this device — best effort, may drift a few minutes.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
      }
    } catch (_: SecurityException) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
    }
  }

  fun cancelAll(context: Context) {
    val am = context.getSystemService(AlarmManager::class.java) ?: return
    TYPES.forEach { am.cancel(firePendingIntent(context, it)) }
  }

  fun canUseExact(context: Context): Boolean =
    context.getSystemService(AlarmManager::class.java)?.let { canUseExact(it) } ?: false

  private fun canUseExact(am: AlarmManager): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()

  private fun nextTarget(hour: Int, minute: Int, after: Long): Long {
    val cal = Calendar.getInstance().apply {
      timeInMillis = after
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    if (cal.timeInMillis <= after) cal.add(Calendar.DAY_OF_YEAR, 1)
    return cal.timeInMillis
  }

  private fun firePendingIntent(context: Context, type: String, target: Long = 0L): PendingIntent {
    val intent = Intent(context, ReminderReceiver::class.java)
      .setAction(ACTION_FIRE)
      .putExtra(EXTRA_TYPE, type)
      .putExtra(EXTRA_TARGET, target)
    return PendingIntent.getBroadcast(
      context,
      requestCode(type),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  fun openAppPendingIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
    return PendingIntent.getActivity(
      context,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun requestCode(type: String): Int = if (type == TYPE_CHECKIN) 9301 else 9302
}
