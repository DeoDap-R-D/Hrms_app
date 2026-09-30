import { NativeModules, Platform } from 'react-native';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { BASE_URL } from '../api/client';
import { getToken } from '../api/storage';
import type { LocalNotification } from '../api/storage';

/**
 * Daily attendance reminders, run natively on Android (see
 * android/app/src/main/java/com/hrmsapp/reminders):
 *   • 9:30 AM  — Check-in reminder,  only if the user hasn't checked in
 *   • 7:30 PM  — Check-out reminder, only if the user hasn't checked out
 *
 * At the exact time an AlarmManager alarm wakes a native receiver, which calls
 * GET /punch/status with the signed-in user's token and shows the notification
 * ONLY if the punch is still missing. Nothing is shown first and retracted
 * later, and it works even if the app is never opened after sign-in (the check
 * happens at fire time, so punches made on the biometric machine are seen too).
 * The alarms re-arm themselves daily and after reboot / app update.
 */

// Android locks a channel's sound once it is created, so a new tune needs a new
// channel id. The previous channel is deleted so only one shows in Settings.
export const CHANNEL_ID = 'attendance-reminders-hrms';
const CHANNEL_SOUND = 'hrms_notification'; // res/raw/hrms_notification.aac (no extension)
const OLD_CHANNEL_IDS = ['attendance-reminders-custom'];

const CHECKIN_HOUR = 9;
const CHECKIN_MINUTE = 30; // 9:30 AM
const CHECKOUT_HOUR = 19;
const CHECKOUT_MINUTE = 30; // 7:30 PM

// Ids of the previous Notifee-based reminders — cancelled on upgrade so they
// can't fire alongside the native ones.
const LEGACY_TRIGGER_IDS = ['checkin-reminder', 'checkout-reminder'];

interface AttendanceRemindersModule {
  configure(options: {
    token: string;
    baseUrl: string;
    checkInHour: number;
    checkInMinute: number;
    checkOutHour: number;
    checkOutMinute: number;
  }): Promise<boolean>;
  cancelAll(): Promise<void>;
  getDelivered(): Promise<string>;
  markRead(id: string): Promise<void>;
}

const Reminders: AttendanceRemindersModule | undefined =
  Platform.OS === 'android' ? NativeModules.AttendanceReminders : undefined;

/** Create the Android channel. Idempotent and shows no dialog / launches no UI. */
export async function ensureChannel(): Promise<void> {
  for (const id of OLD_CHANNEL_IDS) {
    await notifee.deleteChannel(id).catch(() => {});
  }
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Attendance Reminders',
    importance: AndroidImportance.HIGH,
    sound: CHANNEL_SOUND,
  });
}

/**
 * Request notification permission ONCE (this shows the system dialog, so it must
 * only run from the foreground — e.g. just after sign-in, never from a
 * background/foreground re-sync). Repeatedly requesting it caused Android 14+ to
 * block the permission-activity launch and bounce the app to the launcher.
 */
export async function initNotifications(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    await ensureChannel();
    return settings.authorizationStatus !== AuthorizationStatus.DENIED;
  } catch {
    return false;
  }
}

async function cancelLegacyTriggers(): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications(LEGACY_TRIGGER_IDS);
  } catch {
    // ignore
  }
}

// syncReminders runs from both the auth effect and the AppState "active"
// listener, which can fire near-simultaneously — skip overlapping runs.
let syncing = false;

/**
 * Hand the current login token + reminder times to the native scheduler and
 * (re)arm both alarms. Safe to call often (every app open / foreground) — it
 * also refreshes the saved token.
 */
export async function syncReminders(): Promise<void> {
  if (syncing || !Reminders) return;
  syncing = true;
  try {
    await cancelLegacyTriggers();
    await ensureChannel();
    const token = await getToken();
    if (!token) return;
    await Reminders.configure({
      token,
      baseUrl: BASE_URL,
      checkInHour: CHECKIN_HOUR,
      checkInMinute: CHECKIN_MINUTE,
      checkOutHour: CHECKOUT_HOUR,
      checkOutMinute: CHECKOUT_MINUTE,
    });
  } catch {
    // never let reminder syncing disrupt the app
  } finally {
    syncing = false;
  }
}

/** Cancel all reminders and forget the user (e.g. on sign-out). */
export async function cancelReminders(): Promise<void> {
  await cancelLegacyTriggers();
  try {
    await Reminders?.cancelAll();
  } catch {
    // ignore
  }
}

/** Reminders the native side has shown, for the in-app Notifications screen. */
export async function getDeliveredReminders(): Promise<LocalNotification[]> {
  try {
    const raw = await Reminders?.getDelivered();
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as LocalNotification[]) : [];
  } catch {
    return [];
  }
}

export async function markReminderRead(id: string): Promise<void> {
  try {
    await Reminders?.markRead(id);
  } catch {
    // ignore
  }
}
