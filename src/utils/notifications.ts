import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
  RepeatFrequency,
  TriggerType,
  Event,
} from '@notifee/react-native';
import dayjs from 'dayjs';
import * as svc from '../api/services';
import { addLocalNotification, getReminderMarks, markReminderDelivered } from '../api/storage';

/**
 * Local attendance reminders, scheduled through the OS (AlarmManager) so they
 * fire whether the app is in the foreground, background, or fully closed:
 *   • 9:30 AM — Check-in reminder  (only if the user hasn't checked in)
 *   • 7:30 PM — Check-out reminder (only if the user hasn't checked out)
 *
 * The "only if missing" condition is enforced two ways so it holds even when the
 * app is closed:
 *   1. Proactively — we cancel today's reminder the moment the user punches in
 *      the app, and re-sync (re-evaluate) on every app open / foreground.
 *   2. At delivery — when a reminder fires, Notifee runs `handleNotifeeEvent`
 *      (in a headless JS task on Android, even if the app is killed); it checks
 *      the live punch status and retracts the notification if the punch is
 *      already done. This is also where the reminder is saved to the in-app
 *      Notifications screen.
 */

// New channel id so the custom sound takes effect (Android locks a channel's
// sound after first creation, so changing it requires a fresh channel id).
const CHANNEL_ID = 'attendance-reminders-custom';
const CHANNEL_SOUND = 'reminder_sound'; // res/raw/reminder_sound.mp3 (no extension)
const CHECKIN_ID = 'checkin-reminder';
const CHECKOUT_ID = 'checkout-reminder';

const CHECKIN_HOUR = 9;
const CHECKIN_MINUTE = 30; // 9:30 AM
const CHECKOUT_HOUR = 19;
const CHECKOUT_MINUTE = 30; // 7:30 PM

/** Create the Android channel. Idempotent and shows no dialog / launches no UI. */
async function ensureChannel(): Promise<void> {
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

/** Next epoch-ms for hour:minute today; tomorrow if already past (or forced). */
function nextAt(hour: number, minute: number, forceTomorrow = false): number {
  let t = dayjs().hour(hour).minute(minute).second(0).millisecond(0);
  if (forceTomorrow || !t.isAfter(dayjs())) t = t.add(1, 'day');
  return t.valueOf();
}

/** Read whether the user has already checked in / out today. */
function derivePunch(status: any): { checkedIn: boolean; checkedOut: boolean } {
  const state = String(status?.state ?? '');
  const checkedIn = !!status?.punch?.intime || (state !== '' && state !== 'not_punched');
  const checkedOut = !!status?.punch?.outtime || state === 'punched_out';
  return { checkedIn, checkedOut };
}

/** Whether the OS currently allows scheduling exact alarms (Android 12+). */
async function canUseExactAlarm(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    // DISABLED only on Android 12+ when the permission was revoked; ENABLED or
    // NOT_SUPPORTED (older Android, no permission needed) both mean exact is OK.
    return settings.android?.alarm !== AndroidNotificationSetting.DISABLED;
  } catch {
    return true; // assume allowed; the try/catch below covers any failure
  }
}

async function scheduleDaily(id: string, title: string, body: string, timestamp: number): Promise<void> {
  const notification = {
    id,
    title,
    body,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
  };
  const base = {
    type: TriggerType.TIMESTAMP as const,
    timestamp,
    repeatFrequency: RepeatFrequency.DAILY,
  };

  const exact = await canUseExactAlarm();
  try {
    // Exact (fires precisely, even in Doze) when allowed; otherwise inexact so
    // the reminder still fires on every device / permission state.
    await notifee.createTriggerNotification(
      notification,
      exact ? { ...base, alarmManager: { allowWhileIdle: true } } : base,
    );
  } catch {
    // Exact alarm was rejected by the OS — retry as an inexact trigger so the
    // reminder is never lost.
    await notifee.createTriggerNotification(notification, base);
  }
}

/** Daily 9:30 AM check-in reminder. `skipToday` starts it from tomorrow. */
export async function scheduleCheckIn(skipToday = false): Promise<void> {
  await scheduleDaily(
    CHECKIN_ID,
    'Check-in reminder',
    "You haven't checked in yet — tap to punch in.",
    nextAt(CHECKIN_HOUR, CHECKIN_MINUTE, skipToday),
  );
}

/** Daily 7:30 PM check-out reminder. `skipToday` starts it from tomorrow. */
export async function scheduleCheckOut(skipToday = false): Promise<void> {
  await scheduleDaily(
    CHECKOUT_ID,
    'Check-out reminder',
    "You haven't checked out yet — don't forget to punch out.",
    nextAt(CHECKOUT_HOUR, CHECKOUT_MINUTE, skipToday),
  );
}

/**
 * Ensure both reminders are scheduled. Each reminder is skipped for today if the
 * corresponding punch is already done, so it won't fire after the user has
 * checked in / out. (Re-evaluated on every app open / foreground.)
 */
// Guard against overlapping runs: syncReminders is called from both the auth
// effect and the AppState "active" listener, which can fire near-simultaneously
// and otherwise schedule the same alarm twice (the cause of double reminders).
let syncing = false;

export async function syncReminders(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    // No permission *request* here (that would launch the system permission UI
    // and can bounce the app to the launcher when called on every foreground).
    // Just read the current state silently and schedule.
    await ensureChannel();
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) return;

    let checkedIn = false;
    let checkedOut = false;
    try {
      const status = await svc.punchStatus();
      ({ checkedIn, checkedOut } = derivePunch(status));
    } catch {
      // offline / failed — leave whatever is already scheduled
    }
    // Skip today's reminder if the punch is already done, so it only fires when
    // the check-in / check-out is still missing.
    await scheduleCheckIn(checkedIn);
    await scheduleCheckOut(checkedOut);
  } catch {
    // never let reminder syncing disrupt the app
  } finally {
    syncing = false;
  }
}

/** Call right after a successful in-app punch-in to clear today's reminder. */
export async function onCheckedIn(): Promise<void> {
  try {
    await scheduleCheckIn(true);
  } catch {
    // ignore
  }
}

/** Call right after a successful in-app punch-out to clear today's reminder. */
export async function onCheckedOut(): Promise<void> {
  try {
    await scheduleCheckOut(true);
  } catch {
    // ignore
  }
}

/** Cancel all reminders (e.g. on sign-out). */
export async function cancelReminders(): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(CHECKIN_ID);
    await notifee.cancelTriggerNotification(CHECKOUT_ID);
  } catch {
    // ignore
  }
}

/**
 * Handle a Notifee event (foreground or background/headless). On delivery of a
 * reminder we (a) suppress it if the punch is already done, otherwise (b) record
 * it for the in-app Notifications screen.
 */
export async function handleNotifeeEvent(type: EventType, detail: Event['detail']): Promise<void> {
  try {
    const notif = detail?.notification;
    const id = notif?.id;
    if (!id) return;

    const isCheckIn = id === CHECKIN_ID;
    const isCheckOut = id === CHECKOUT_ID;
    if (!isCheckIn && !isCheckOut) return;

    if (type !== EventType.DELIVERED) return;

    const today = dayjs().format('YYYY-MM-DD');

    // Exactly-once per day: if this reminder was already delivered today, cancel
    // the duplicate and stop (guards against any second trigger firing).
    const marks = await getReminderMarks();
    if (marks[id] === today) {
      await notifee.cancelDisplayedNotification(id);
      return;
    }

    // Conditional: if the relevant punch is already done, retract and don't log
    // (and don't mark, so it isn't treated as "delivered").
    try {
      const status = await svc.punchStatus();
      const { checkedIn, checkedOut } = derivePunch(status);
      if ((isCheckIn && checkedIn) || (isCheckOut && checkedOut)) {
        await notifee.cancelDisplayedNotification(id);
        return;
      }
    } catch {
      // offline — can't verify, so keep the reminder (safer to remind).
    }

    // Record this delivery, then surface it on the in-app Notifications screen.
    await markReminderDelivered(id, today);
    await addLocalNotification({
      id: `${id}-${today}`,
      title: notif?.title ?? 'Reminder',
      message: notif?.body ?? '',
      created_at: new Date().toISOString(),
      is_read: 0,
    });
  } catch {
    // never let the headless handler crash
  }
}

/** Register the foreground event handler. Returns an unsubscribe function. */
export function registerForegroundHandler(): () => void {
  return notifee.onForegroundEvent(({ type, detail }) => {
    handleNotifeeEvent(type, detail);
  });
}
