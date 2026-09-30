/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundPushHandler } from './src/utils/push';
import applyGlobalFont from './src/utils/applyGlobalFont';

// Apply Poppins (Google Font) to all text app-wide.
applyGlobalFont();

// Production resilience: log uncaught JS errors but don't let them hard-close
// the app. (Render-time errors are handled by the ErrorBoundary; this catches
// async / event-handler errors that would otherwise terminate the process.)
if (!__DEV__ && global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      // eslint-disable-next-line no-console
      console.error('[GlobalError]', isFatal ? 'fatal' : 'non-fatal', error && error.message, error && error.stack);
    } catch (_) {}
    // Intentionally not re-throwing / not calling the default handler so the
    // app stays alive on its current screen instead of exiting to the launcher.
  });
}

// Notifee requires a background handler. Attendance reminders are handled
// natively (see src/utils/notifications.ts), so there is nothing to do here.
notifee.onBackgroundEvent(async () => {});

// Firebase push: required background handler (the OS displays the message).
registerBackgroundPushHandler();

AppRegistry.registerComponent(appName, () => App);
