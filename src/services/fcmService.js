import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission as requestMessagingPermission,
} from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { notificationsApi } from './notificationsApi';
import { displayFcmNotification, ensureNotifeeChannels, requestNotifeePermission } from './notifeeService';

// FCM token lifecycle + message handling — ported to this app's own
// conventions: deviceRepository's stable installation UUID is used as the
// account-scoped push-installation identity. It is intentionally separate
// from shop-scoped cloud-sync device registration. Backend push uses
// @react-native-firebase/messaging directly; Notifee is the display layer for
// both backend and device-local notifications. The background/quit-state handler is registered
// separately in index.js (must run before App.jsx even mounts).

let unsubscribeTokenRefresh = null;
let unsubscribeForegroundMessage = null;
let initialized = false;
let registrationPromise = null;

async function requestPermission() {
  // On Android 13+ (API 33+) this triggers the runtime POST_NOTIFICATIONS
  // prompt (declared in app.config.js's android.permissions); on older
  // Android and iOS it resolves per that platform's own rules.
  const status = await requestMessagingPermission(getMessaging());
  console.log('[backend-notifications] FCM permission result', {
    source: 'backend-fcm',
    platform: Platform.OS,
    status,
    granted: status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL,
  });
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

function getDeviceName() {
  return Constants.deviceName || Constants.platform?.ios?.model || `AsaanKhata ${Platform.OS} device`;
}

export async function registerCurrentToken() {
  if (registrationPromise) return registrationPromise;
  const pendingRegistration = (async () => {
    const device = deviceRepository.getOrCreate();
    const fcmToken = await getToken(getMessaging());
    if (!fcmToken) {
      console.warn('[backend-notifications] FCM token unavailable', { source: 'backend-fcm', platform: Platform.OS });
      return null;
    }
    await notificationsApi.registerToken({
      installationId: device.deviceId,
      fcmToken,
      deviceName: getDeviceName(),
      platform: Platform.OS,
    });
    console.log('[backend-notifications] FCM token registered', { source: 'backend-fcm', installationId: device.deviceId, deviceName: getDeviceName() });
    return fcmToken;
  })().catch((err) => {
    console.warn('[backend-notifications] FCM token registration failed', {
      message: err?.message,
      status: err?.response?.status,
      code: err?.response?.data?.code,
      serverMessage: err?.response?.data?.message,
    });
    return null;
  }).finally(() => {
    registrationPromise = null;
  });
  registrationPromise = pendingRegistration;
  return pendingRegistration;
}

// Call once at app startup (see App.jsx, alongside initAds()/initAnalytics()).
// Idempotent, safe to call again. Never throws — push is an enhancement, not
// something the app depends on to function.
export async function initFcm() {
  if (initialized) return;
  initialized = true;

  try {
    const granted = await requestPermission();
    if (!granted) {
      console.warn('[backend-notifications] FCM notifications not authorized', { source: 'backend-fcm', platform: Platform.OS });
      return;
    }

    // Notifee owns the visible foreground notification. The channel must exist
    // before the first FCM message arrives, especially on Android 13+.
    await ensureNotifeeChannels();
    const notifeeGranted = await requestNotifeePermission();
    console.log('[backend-notifications] Notifee permission result', {
      source: 'backend-fcm',
      platform: Platform.OS,
      granted: notifeeGranted,
    });

    await registerCurrentToken();

    unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), async (fcmToken) => {
      const device = deviceRepository.getOrCreate();
      if (!fcmToken) return;
      try {
        await notificationsApi.registerToken({ installationId: device.deviceId, fcmToken, deviceName: getDeviceName(), platform: Platform.OS });
      } catch (err) {
        // best-effort, see above
      }
    });

    // Firebase does not put foreground messages in the system tray. Use
    // Notifee so notification/data-only messages have the same visible
    // behavior in every app state.
    unsubscribeForegroundMessage = onMessage(getMessaging(), async (remoteMessage) => {
      const title = remoteMessage?.notification?.title;
      const body = remoteMessage?.notification?.body;
      console.log('[backend-notifications] FCM received in foreground', {
        source: 'backend-fcm',
        messageId: remoteMessage?.messageId,
        title,
        body,
        data: remoteMessage?.data,
      });
      await displayFcmNotification(remoteMessage);
    });
  } catch (err) {
    // Permission denied, Play Services unavailable, etc. — push is best-effort.
    console.warn('[backend-notifications] FCM initialization failed', {
      source: 'backend-fcm',
      platform: Platform.OS,
      message: err?.message,
      code: err?.code,
    });
  }
}

// Call on logout (see Settings.jsx's handleLogout) — an FCM token left
// registered to a signed-out account would keep receiving that account's
// pushes on a shared/reused device.
export async function unregisterCurrentDevice() {
  try {
    const device = deviceRepository.getOrCreate();
    await notificationsApi.removeToken({ installationId: device.deviceId });
  } catch (err) {
    // best-effort
  }
}

export function teardownFcmListeners() {
  unsubscribeTokenRefresh?.();
  unsubscribeForegroundMessage?.();
  unsubscribeTokenRefresh = null;
  unsubscribeForegroundMessage = null;
  initialized = false;
}

export const fcmService = {
  initFcm,
  unregisterCurrentDevice,
  teardownFcmListeners,
};
