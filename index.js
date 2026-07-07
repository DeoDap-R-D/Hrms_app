/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleNotifeeEvent } from './src/utils/notifications';
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

// Runs in a headless JS task when a reminder is delivered while the app is in
// the background or fully closed — enforces the "only if punch missing"
// condition and records the reminder for the in-app Notifications screen.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  await handleNotifeeEvent(type, detail);
});

AppRegistry.registerComponent(appName, () => App);
