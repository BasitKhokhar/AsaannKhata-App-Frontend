import messaging from '@react-native-firebase/messaging';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { notificationsApi } from './notificationsApi';
import { showToast } from '../store/toastStore';

// FCM token lifecycle + message handling — ported to this app's own
// conventions: deviceRepository's stable deviceId (the same one used for
// cloud sync's POST /sync/devices/register, see src/sync/syncEngine.js) is
// reused as the identity a push token is attached to, matching the backend's
// /notifications/register-token contract. No expo-notifications anywhere in
// this app — @react-native-firebase/messaging's own permission + token APIs
// are used directly. The background/quit-state handler is registered
// separately in index.js (must run before App.jsx even mounts).

let unsubscribeTokenRefresh = null;
let unsubscribeForegroundMessage = null;
let initialized = false;

async function requestPermission() {
  // On Android 13+ (API 33+) this triggers the runtime POST_NOTIFICATIONS
  // prompt (declared in app.config.js's android.permissions); on older
  // Android and iOS it resolves per that platform's own rules.
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function registerCurrentToken() {
  const device = deviceRepository.getOrCreate();
  if (!device.registered) {
    // Mirrors ensureDeviceRegistered() in src/sync/syncEngine.js — a device
    // must exist on the backend (via /sync/devices/register) before a push
    // token can be attached to it. If sync hasn't registered it yet, skip
    // silently; the next successful sync followed by the next app-open or
    // token-refresh cycle will retry.
    return null;
  }
  const fcmToken = await messaging().getToken();
  if (!fcmToken) return null;
  try {
    await notificationsApi.registerToken({ deviceId: device.deviceId, fcmToken });
  } catch (err) {
    // Best-effort — a failed registration just means this device won't get
    // pushes until the next successful attempt (app open / token refresh).
  }
  return fcmToken;
}

// Call once at app startup (see App.jsx, alongside initAds()/initAnalytics()).
// Idempotent, safe to call again. Never throws — push is an enhancement, not
// something the app depends on to function.
export async function initFcm() {
  if (initialized) return;
  initialized = true;

  try {
    const granted = await requestPermission();
    if (!granted) return;

    await registerCurrentToken();

    unsubscribeTokenRefresh = messaging().onTokenRefresh(async (fcmToken) => {
      const device = deviceRepository.getOrCreate();
      if (!device.registered || !fcmToken) return;
      try {
        await notificationsApi.registerToken({ deviceId: device.deviceId, fcmToken });
      } catch (err) {
        // best-effort, see above
      }
    });

    // Foreground messages don't show a system tray notification on their
    // own — surface them as an in-app toast using this app's existing toast
    // queue (src/store/toastStore.js) instead of adding a new banner component.
    unsubscribeForegroundMessage = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage?.notification?.title;
      const body = remoteMessage?.notification?.body;
      const message = [title, body].filter(Boolean).join(' — ') || 'You have a new notification.';
      showToast(message, 'neutral');
    });
  } catch (err) {
    // Permission denied, Play Services unavailable, etc. — push is best-effort.
  }
}

// Call on logout (see Settings.jsx's handleLogout) — an FCM token left
// registered to a signed-out account would keep receiving that account's
// pushes on a shared/reused device.
export async function unregisterCurrentDevice() {
  try {
    const device = deviceRepository.getOrCreate();
    await notificationsApi.removeToken({ deviceId: device.deviceId });
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
