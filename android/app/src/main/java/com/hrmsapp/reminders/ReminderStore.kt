package com.hrmsapp.reminders

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Persisted reminder settings (written by JS through [ReminderModule]) plus the
 * list of reminders actually shown, so the in-app Notifications screen can list
 * them. Plain SharedPreferences so the alarm receiver can read it without
 * starting React Native.
 */
class ReminderStore(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences("hrms_reminders", Context.MODE_PRIVATE)

  var enabled: Boolean
    get() = prefs.getBoolean(KEY_ENABLED, false)
    set(v) = prefs.edit().putBoolean(KEY_ENABLED, v).apply()

  var token: String?
    get() = prefs.getString(KEY_TOKEN, null)
    set(v) = prefs.edit().putString(KEY_TOKEN, v).apply()

  var baseUrl: String
    get() = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    set(v) = prefs.edit().putString(KEY_BASE_URL, v).apply()

  fun hour(type: String): Int =
    prefs.getInt("hour_$type", if (type == ReminderScheduler.TYPE_CHECKIN) 9 else 19)

  fun minute(type: String): Int = prefs.getInt("minute_$type", 30)

  fun setTime(type: String, hour: Int, minute: Int) {
    prefs.edit().putInt("hour_$type", hour).putInt("minute_$type", minute).apply()
  }

  /** Slot (yyyy-MM-dd'T'HH:mm) a reminder was last shown for — guards against double firing. */
  fun lastShown(type: String): String? = prefs.getString("shown_$type", null)

  fun markShown(type: String, slot: String) {
    prefs.edit().putString("shown_$type", slot).apply()
  }

  /** Reminders shown so far (newest first, capped), as a JSON array string. */
  fun delivered(): JSONArray =
    try {
      JSONArray(prefs.getString(KEY_DELIVERED, "[]"))
    } catch (_: Exception) {
      JSONArray()
    }

  @Synchronized
  fun addDelivered(item: JSONObject) {
    val current = delivered()
    val next = JSONArray().put(item)
    for (i in 0 until minOf(current.length(), MAX_DELIVERED - 1)) {
      val existing = current.optJSONObject(i) ?: continue
      if (existing.optString("id") != item.optString("id")) next.put(existing)
    }
    prefs.edit().putString(KEY_DELIVERED, next.toString()).apply()
  }

  @Synchronized
  fun markRead(id: String) {
    val list = delivered()
    for (i in 0 until list.length()) {
      val item = list.optJSONObject(i) ?: continue
      if (item.optString("id") == id) item.put("is_read", 1)
    }
    prefs.edit().putString(KEY_DELIVERED, list.toString()).apply()
  }

  /** Forget the signed-in user (logout). */
  fun clear() {
    prefs.edit().clear().apply()
  }

  companion object {
    private const val KEY_ENABLED = "enabled"
    private const val KEY_TOKEN = "token"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_DELIVERED = "delivered"
    private const val MAX_DELIVERED = 50
    const val DEFAULT_BASE_URL = "https://apps.deodap.info/hrms-app/api"
  }
}
