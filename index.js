import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { displayFcmNotification, registerNotifeeBackgroundEvents } from './src/services/notifeeService';

import App from './App';

const sentryDsn =
  Constants.expoConfig?.extra?.sentryDsn ||
  process.env.SENTRY_DSN_URL ||
  process.env.SENTRY_DSN ||
  process.env.EXPO_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    debug: false,
  });
}

// Must be registered before registerRootComponent/App even mounts — this is
// what fires when a push arrives while the app is backgrounded or fully
// quit. The OS renders the notification itself from the FCM payload's
// `notification` block; this handler is the hook point for any future
// data-message-only processing (e.g. updating a locally cached badge count)
// and its presence silences Android's "missing background handler" warning.
registerNotifeeBackgroundEvents();

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('[backend-notifications] FCM received in background/quit state', {
    source: 'backend-fcm',
    messageId: remoteMessage?.messageId,
    title: remoteMessage?.notification?.title,
    body: remoteMessage?.notification?.body,
    data: remoteMessage?.data,
  });
  // Notification payloads are already rendered by Android/iOS in background.
  // Data-only FCM payloads need Notifee to render a visible notification.
  if (!remoteMessage?.notification) await displayFcmNotification(remoteMessage);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Sentry.wrap(App));
