import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHANNEL_ID, ensureChannel } from './notifications';

/**
 * Firebase Cloud Messaging (push notifications).
 *
 * • App closed / background — Android displays FCM "notification" messages
 *   itself, on the channel configured in firebase.json (custom reminder sound).
 * • App in foreground — FCM does not display anything, so `onMessage` shows the
 *   message through Notifee on the same channel.
 */

const FCM_TOKEN_KEY = '@hrms/fcmToken';

/** Show an incoming FCM message as a local notification (foreground only). */
async function displayRemote(message: RemoteMessage): Promise<void> {
  const title = message.notification?.title ?? message.data?.title;
  const body = message.notification?.body ?? message.data?.body;
  if (!title && !body) return;
  await ensureChannel();
  await notifee.displayNotification({
    id: message.messageId,
    title: title ? String(title) : undefined,
    body: body ? String(body) : undefined,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
  });
}

/**
 * Register the background handler. Must run at startup (index.js), outside the
 * React tree. Notification messages are shown by the OS, so nothing to do here.
 */
export function registerBackgroundPushHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async () => {});
}

/** The last FCM token issued to this device (for debugging / display). */
export async function getSavedFcmToken(): Promise<string | null> {
  return AsyncStorage.getItem(FCM_TOKEN_KEY);
}

/**
 * Fetch this device's FCM token and start listening for foreground messages
 * and token refreshes. Call after sign-in, once notification permission has
 * been requested. Returns an unsubscribe function.
 */
export function initPush(): () => void {
  const messaging = getMessaging();

  const saveToken = (token: string) => {
    AsyncStorage.setItem(FCM_TOKEN_KEY, token).catch(() => {});
    // eslint-disable-next-line no-console
    console.log('[FCM] token', token);
  };

  getToken(messaging).then(saveToken).catch(() => {});

  const unsubMessage = onMessage(messaging, message => {
    // Attendance-reminder pushes are handled natively (punch checked first) —
    // see ReminderMessagingService.kt. Never display them from JS.
    if (message.data?.reminder) return;
    displayRemote(message).catch(() => {});
  });
  const unsubRefresh = onTokenRefresh(messaging, saveToken);

  return () => {
    unsubMessage();
    unsubRefresh();
  };
}
