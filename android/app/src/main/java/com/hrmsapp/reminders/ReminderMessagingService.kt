package com.hrmsapp.reminders

import android.content.Intent
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService

/**
 * Firebase messaging service that intercepts attendance-reminder pushes.
 *
 * A Firebase Console campaign scheduled at the reminder time carries the custom
 * data `reminder = checkin | checkout`. Instead of letting Firebase display it
 * automatically (which would notify users who already punched), we check the
 * punch status first and only notify if the punch is missing — the same logic
 * as the local alarm, which remains as a backup (at most one reminder per day).
 *
 * Every other message goes through React Native Firebase as usual.
 */
class ReminderMessagingService : ReactNativeFirebaseMessagingService() {
  override fun handleIntent(intent: Intent) {
    val type = intent.getStringExtra(KEY_REMINDER)
    if (type == ReminderScheduler.TYPE_CHECKIN || type == ReminderScheduler.TYPE_CHECKOUT) {
      // Runs on Firebase's background thread; check first, notify only if missing.
      ReminderWorker.run(applicationContext, type, System.currentTimeMillis())
      return
    }
    super.handleIntent(intent)
  }

  companion object {
    /** Custom data key set on the Firebase Console campaign. */
    const val KEY_REMINDER = "reminder"
  }
}
