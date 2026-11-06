import { File } from 'expo-file-system';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { receiptProfiles } from '../schema';
import { shopRepository } from './shopRepository';
import { normalizeReceiptConfig } from '../../utils/receiptConfig';
import { useLanguageStore } from '../../store/languageStore';

function get(shopId) {
  return db.select().from(receiptProfiles).where(eq(receiptProfiles.shopId, String(shopId))).get();
}
function resolved(shopId) {
  const shop = shopRepository.getById(shopId);
  const stored = get(shopId);
  let logoData = '';
  try {
    const file = shop?.logoLocalUri ? new File(shop.logoLocalUri) : null;
    if (file?.exists && file.size <= 50 * 1024) logoData = `data:image/jpeg;base64,${file.base64Sync()}`;
  } catch { /* A missing cached logo must not prevent billing. */ }
  return normalizeReceiptConfig({ logoData, displayName: shop?.name || 'AsaanKhata', address: shop?.address || '', phone: shop?.phone || '', language: useLanguageStore.getState().lang, ...stored?.config });
}
function save(shopId, config) {
  if (!shopId || !shopRepository.getById(shopId)) throw new Error('receipt.noShop');
  const existing = get(shopId);
  const row = { shopId: String(shopId), config: normalizeReceiptConfig(config), version: existing?.version || 0, syncStatus: 'pending', updatedAt: new Date().toISOString() };
  db.insert(receiptProfiles).values(row).onConflictDoUpdate({ target: receiptProfiles.shopId, set: row }).run();
  return row;
}
function accept(shopId, remote, expectedUpdatedAt) {
  const current = get(shopId);
  // Never acknowledge an edit made while the request was in flight.
  if (['pending', 'conflict'].includes(current?.syncStatus) && current.updatedAt !== expectedUpdatedAt) {
    db.update(receiptProfiles).set({ version: remote.version }).where(eq(receiptProfiles.shopId, String(shopId))).run();
    return;
  }
  const row = { shopId: String(shopId), config: normalizeReceiptConfig(remote.config), version: remote.version, syncStatus: 'synced', updatedAt: remote.updatedAt };
  db.insert(receiptProfiles).values(row).onConflictDoUpdate({ target: receiptProfiles.shopId, set: row }).run();
}
function markConflict(shopId) {
  db.update(receiptProfiles).set({ syncStatus: 'conflict' }).where(eq(receiptProfiles.shopId, String(shopId))).run();
}
function rebase(shopId, version) {
  db.update(receiptProfiles).set({ version, syncStatus: 'pending' }).where(eq(receiptProfiles.shopId, String(shopId))).run();
}
export const receiptProfileRepository = { get, resolved, save, accept, markConflict, rebase };
