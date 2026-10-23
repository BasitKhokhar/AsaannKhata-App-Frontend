import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import messaging from '@react-native-firebase/messaging';

import App from './App';

const sentryDsn =
  Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  const release =
    Constants.expoConfig?.extra?.sentryRelease ||
    Constants.expoConfig?.version ||
    'unknown';
  const environment =
    Constants.expoConfig?.extra?.sentryEnvironment ||
    (__DEV__ ? 'development' : 'production');
  const dist = Constants.expoConfig?.extra?.sentryDist || undefined;

  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment,
    release,
    dist,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    beforeSend(event) {
      if (event?.user?.email) {
        delete event.user.email;
      }
      return event;
    },
  });

  Sentry.setTag('app-platform', Platform.OS);
}

// Must be registered before registerRootComponent/App even mounts — this is
// what fires when a push arrives while the app is backgrounded or fully
// quit. The OS renders the notification itself from the FCM payload's
// `notification` block; this handler is the hook point for any future
// data-message-only processing (e.g. updating a locally cached badge count)
// and its presence silences Android's "missing background handler" warning.
messaging().setBackgroundMessageHandler(async (remoteMessage) => { });

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Sentry.wrap(App));
