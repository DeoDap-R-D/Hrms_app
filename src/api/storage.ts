import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@hrms/token';
const USER_KEY = '@hrms/user';
const ONBOARDED_KEY = '@hrms/onboarded';
const LOCAL_NOTIF_KEY = '@hrms/localNotifications';
const REMINDER_MARK_KEY = '@hrms/reminderMarks';

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
}

export async function saveUser(user: unknown): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser<T = any>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

/** First-launch onboarding flag (persists across logouts — shown only once). */
export async function getOnboardingSeen(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
}

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, '1');
}

/* ------------------------- Local (device) notifications ------------------------- */
/**
 * Locally-delivered reminders (check-in / check-out) are persisted here so the
 * in-app Notifications screen can show them alongside the server notifications.
 * Written from the Notifee background/foreground event handler.
 */
export interface LocalNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: 0 | 1;
}

export async function getLocalNotifications(): Promise<LocalNotification[]> {
  const raw = await AsyncStorage.getItem(LOCAL_NOTIF_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalNotification[];
  } catch {
    return [];
  }
}

export async function addLocalNotification(item: LocalNotification): Promise<void> {
  const list = await getLocalNotifications();
  if (list.some(n => n.id === item.id)) return; // de-dupe (same reminder, same day)
  await AsyncStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify([item, ...list].slice(0, 50)));
}

export async function markLocalNotificationRead(id: string): Promise<void> {
  const list = await getLocalNotifications();
  let changed = false;
  const next = list.map(n => {
    if (n.id === id && !n.is_read) {
      changed = true;
      return { ...n, is_read: 1 as const };
    }
    return n;
  });
  if (changed) await AsyncStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(next));
}

export async function clearLocalNotifications(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_NOTIF_KEY);
}

/* ------------------------- Reminder delivery marks ------------------------- */
/**
 * Records the last date (YYYY-MM-DD) each reminder was actually delivered, so a
 * reminder is shown at most once per day even if a duplicate trigger fires.
 */
export async function getReminderMarks(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(REMINDER_MARK_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function markReminderDelivered(id: string, date: string): Promise<void> {
  const marks = await getReminderMarks();
  marks[id] = date;
  await AsyncStorage.setItem(REMINDER_MARK_KEY, JSON.stringify(marks));
}
