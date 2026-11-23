import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

export const LOW_STOCK_CHANNEL_ID = 'local-low-stock';
export const BACKEND_CHANNEL_ID = 'backend-notifications';

export async function ensureNotifeeChannels() {
  await notifee.createChannel({ id: LOW_STOCK_CHANNEL_ID, name: 'Low stock reminders', importance: AndroidImportance.HIGH, vibration: true });
  await notifee.createChannel({ id: BACKEND_CHANNEL_ID, name: 'App notifications', importance: AndroidImportance.HIGH, vibration: true });
}

export async function requestNotifeePermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED || settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
}

function notificationData(remoteMessage) {
  const data = remoteMessage?.data || {};
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]));
}

export async function displayFcmNotification(remoteMessage) {
  const data = notificationData(remoteMessage);
  const title = remoteMessage?.notification?.title || data.title || data.notificationTitle || 'Asaan Dukaan';
  const body = remoteMessage?.notification?.body || data.body || data.notificationBody || 'You have a new notification.';
  await ensureNotifeeChannels();
  const id = await notifee.displayNotification({
    title,
    body,
    data: { ...data, source: 'backend-fcm' },
    android: { channelId: BACKEND_CHANNEL_ID, pressAction: { id: 'default' }, smallIcon: 'ic_launcher' },
    ios: { foregroundPresentationOptions: { alert: true, badge: true, sound: true } },
  });
  console.log('[backend-notifications] Notifee displayed FCM notification', { source: 'backend-fcm', notificationId: id, title, body, data });
  return id;
}

export function createDailyTrigger(hour, minute) {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return { type: TriggerType.TIMESTAMP, timestamp: next.getTime(), repeatFrequency: RepeatFrequency.DAILY };
}

export function subscribeToNotifeeEvents(onPress) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      console.log('[backend-notifications] Notifee notification pressed', { source: detail.notification?.data?.source || 'unknown', notificationId: detail.notification?.id, data: detail.notification?.data });
      onPress?.(detail.notification?.data || {});
    }
  });
}

export async function handleInitialNotifeeNotification(onPress) {
  const initial = await notifee.getInitialNotification();
  if (!initial?.notification) return;
  console.log('[backend-notifications] Notifee opened app from notification', { source: initial.notification.data?.source || 'unknown', notificationId: initial.notification.id, data: initial.notification.data });
  onPress?.(initial.notification.data || {});
}

export function registerNotifeeBackgroundEvents() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[backend-notifications] Notifee background event', { source: detail.notification?.data?.source || 'unknown', type, notificationId: detail.notification?.id, data: detail.notification?.data });
  });
}
