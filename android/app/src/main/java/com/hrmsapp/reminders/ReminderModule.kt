package com.hrmsapp.reminders

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/** JS bridge: `NativeModules.AttendanceReminders`. */
class ReminderModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName(): String = "AttendanceReminders"

  /**
   * Save the signed-in user's token + reminder times and (re)arm both alarms.
   * Resolves with whether exact alarms are allowed on this device.
   */
  @ReactMethod
  fun configure(options: ReadableMap, promise: Promise) {
    try {
      val store = ReminderStore(ctx)
      store.token = options.getString("token")
      options.getString("baseUrl")?.let { store.baseUrl = it }
      store.setTime(
        ReminderScheduler.TYPE_CHECKIN,
        options.getInt("checkInHour"),
        options.getInt("checkInMinute"),
      )
      store.setTime(
        ReminderScheduler.TYPE_CHECKOUT,
        options.getInt("checkOutHour"),
        options.getInt("checkOutMinute"),
      )
      store.enabled = true
      ReminderScheduler.scheduleAll(ctx)
      promise.resolve(ReminderScheduler.canUseExact(ctx))
    } catch (e: Exception) {
      promise.reject("E_REMINDERS", e)
    }
  }

  /** Stop all reminders and forget the user (logout). */
  @ReactMethod
  fun cancelAll(promise: Promise) {
    ReminderScheduler.cancelAll(ctx)
    ReminderStore(ctx).clear()
    promise.resolve(null)
  }

  /** Reminders shown so far, as a JSON array string. */
  @ReactMethod
  fun getDelivered(promise: Promise) {
    promise.resolve(ReminderStore(ctx).delivered().toString())
  }

  @ReactMethod
  fun markRead(id: String, promise: Promise) {
    ReminderStore(ctx).markRead(id)
    promise.resolve(null)
  }
}
