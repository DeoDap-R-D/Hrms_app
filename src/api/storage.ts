import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@hrms/token';
const USER_KEY = '@hrms/user';
const ONBOARDED_KEY = '@hrms/onboarded';
const LOCAL_NOTIF_KEY = '@hrms/localNotifications';

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
 * Reminders delivered by the previous (Notifee-based) reminder system. Kept so
 * the in-app Notifications screen still lists them; new reminders are recorded
 * natively (see getDeliveredReminders in utils/notifications).
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
