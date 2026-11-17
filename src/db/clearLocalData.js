import { expoDb } from './client';
import { clearLocalProductImages } from '../services/productImages';
import { useCartStore } from '../store/cartStore';
import { useSyncStore } from '../store/syncStore';

// Deliberately keep account/session state, cached shops, the stable device ID,
// and entitlement cache. Clearing the device row would make the same install
// consume another cloud-device slot; clearing the entitlement would make plan
// UI temporarily incorrect while offline.
const LOCAL_BUSINESS_TABLES_IN_DELETE_ORDER = [
  'bill_items',
  'customer_payments',
  'stock_transactions',
  'bills',
  'expenses',
  'product_barcodes',
  'products',
  'categories',
  'customers',
  'coin_usage_log',
  'receipt_profiles',
  // Watermarks must go with their local rows. Otherwise the next cloud pull
  // would start after the deleted records and could never restore them.
  'sync_meta',
];

export function clearAllLocalBusinessData() {
  if (useSyncStore.getState().isSyncing) {
    const error = new Error('Wait for cloud sync to finish before deleting local data');
    error.code = 'SYNC_IN_PROGRESS';
    throw error;
  }

  expoDb.withTransactionSync(() => {
    for (const table of LOCAL_BUSINESS_TABLES_IN_DELETE_ORDER) {
      expoDb.execSync(`DELETE FROM ${table}`);
    }
  });

  useCartStore.getState().reset();
  useSyncStore.getState().resetAfterLocalDataClear();

  // SQLite is the authoritative reset. A filesystem cleanup failure should
  // not report the already-committed database transaction as failed.
  try {
    clearLocalProductImages();
  } catch (error) {
    if (__DEV__) console.warn('Could not clear cached product images:', error.message);
  }
}

