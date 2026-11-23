import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productRepository } from '../db/repositories/productRepository';
import { LOW_STOCK_CHANNEL_ID, createDailyTrigger, ensureNotifeeChannels, requestNotifeePermission } from './notifeeService';

const STORAGE_KEY = 'asaankhata-local-low-stock-notifications-v2';
const DAILY_HOUR = 9;
const DAILY_MINUTE = 0;
const MIN_SYNC_INTERVAL_MS = 10 * 1000;

// AppState and permission callbacks can both report that the app is active.
// Keep those events from starting overlapping or back-to-back scheduler runs.
const inFlightSyncs = new Map();
const lastSyncAt = new Map();

function notificationBody(product) {
  return `${product.name} is low in stock. Current stock is at or below its configured threshold.`;
}

async function performSync({ shopId, enabled }) {
  const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || '{}');
  const shopSchedule = saved[shopId] || {};
  const lowStock = enabled ? productRepository.listLowStock(shopId) : [];
  const lowStockIds = new Set(lowStock.map((product) => product.id));

  await ensureNotifeeChannels();

  for (const [productId, notificationId] of Object.entries(shopSchedule)) {
    if (!lowStockIds.has(productId)) {
      await notifee.cancelTriggerNotification(notificationId);
      delete shopSchedule[productId];
      console.log('[local-notifications] cancelled', { shopId, productId, notificationId });
    }
  }

  if (enabled) {
    const granted = await requestNotifeePermission();
    if (!granted) {
      console.warn('[local-notifications] permission-denied', { source: 'frontend-local', shopId });
      return { scheduled: 0, skipped: 'permission-denied' };
    }
    for (const product of lowStock) {
      if (shopSchedule[product.id]) continue;
      const notificationId = await notifee.createTriggerNotification({
        title: 'Low stock alert',
        body: notificationBody(product),
        data: { source: 'frontend-local', kind: 'low-stock', shopId, productId: product.id },
        android: { channelId: LOW_STOCK_CHANNEL_ID, pressAction: { id: 'default' }, smallIcon: 'ic_launcher' },
        ios: { foregroundPresentationOptions: { alert: true, badge: true, sound: true } },
      }, createDailyTrigger(DAILY_HOUR, DAILY_MINUTE));
      shopSchedule[product.id] = notificationId;
      console.log('[local-notifications] scheduled', { source: 'frontend-local', kind: 'low-stock', shopId, productId: product.id, productName: product.name, notificationId, dailyAt: '09:00' });
    }
  }

  saved[shopId] = shopSchedule;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return { scheduled: Object.keys(shopSchedule).length };
}

export function syncLocalLowStockNotifications({ shopId, enabled = true } = {}) {
  if (!shopId) return { scheduled: 0, skipped: 'no-shop' };
  const key = `${shopId}:${enabled ? 'enabled' : 'disabled'}`;
  const existing = inFlightSyncs.get(key);
  if (existing) return existing;

  const now = Date.now();
  if (lastSyncAt.has(key) && now - lastSyncAt.get(key) < MIN_SYNC_INTERVAL_MS) {
    return Promise.resolve({ scheduled: 0, skipped: 'recently-synced' });
  }

  const sync = performSync({ shopId, enabled })
    .then((result) => {
      lastSyncAt.set(key, Date.now());
      return result;
    })
    .finally(() => inFlightSyncs.delete(key));
  inFlightSyncs.set(key, sync);
  return sync;
}
