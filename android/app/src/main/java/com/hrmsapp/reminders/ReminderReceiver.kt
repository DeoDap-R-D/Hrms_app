package com.hrmsapp.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager

/**
 * Receives the reminder alarm (and boot / app-update / clock-change broadcasts).
 *
 * On an alarm it re-arms tomorrow's alarm, then on a background thread, holding
 * a short wake lock, checks the live punch status and only shows the reminder
 * if the punch is still missing.
 */
class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val app = context.applicationContext
    when (intent.action) {
      ReminderScheduler.ACTION_FIRE -> {
        val type = intent.getStringExtra(ReminderScheduler.EXTRA_TYPE) ?: return
        val target = intent.getLongExtra(ReminderScheduler.EXTRA_TARGET, 0L)
          .takeIf { it > 0 } ?: System.currentTimeMillis()
        ReminderScheduler.schedule(app, type, after = target)

        val pending = goAsync()
        val wakeLock = app.getSystemService(PowerManager::class.java)
          ?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "hrmsapp:reminder")
          ?.apply { acquire(WAKE_LOCK_TIMEOUT_MS) }
        Thread {
          try {
            ReminderWorker.run(app, type, target)
          } finally {
            if (wakeLock?.isHeld == true) wakeLock.release()
            pending.finish()
          }
        }.start()
      }
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED -> ReminderScheduler.scheduleAll(app)
    }
  }

  private companion object {
    const val WAKE_LOCK_TIMEOUT_MS = 30_000L
  }
}
