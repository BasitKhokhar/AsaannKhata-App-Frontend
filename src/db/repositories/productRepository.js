import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { products } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';
import { isLowStock } from '../../utils/stock';

const base = createSyncableRepository(products);

// Stock counters live on the product row itself (matches the backend), so
// stock in/out/pack-break adjustments update this table directly — always
// paired with a stock_transactions row via stockRepository for the audit log.
function adjustStock(id, patch) {
  db.update(products)
    .set({ ...patch, updatedAt: new Date().toISOString(), syncStatus: 'pending' })
    .where(eq(products.id, id))
    .run();
  return base.getById(id);
}

function listLowStock(shopId) {
  return base.listByShop(shopId).filter(isLowStock);
}

function setImageRemoteUrl(id, expectedLocalUri, imageRemoteUrl) {
  const product = base.getById(id);
  if (!product || product.imageLocalUri !== expectedLocalUri) return false;
  db.update(products)
    .set({ imageRemoteUrl })
    .where(and(eq(products.id, id), eq(products.imageLocalUri, expectedLocalUri)))
    .run();
  return true;
}

function replaceLocalImageUri(id, expectedLocalUri, imageLocalUri) {
  const product = base.getById(id);
  if (!product || product.imageLocalUri !== expectedLocalUri) return false;
  db.update(products)
    .set({ imageLocalUri, imageRemoteUrl: null })
    .where(and(eq(products.id, id), eq(products.imageLocalUri, expectedLocalUri)))
    .run();
  return true;
}

function setCachedImage(id, imageRemoteUrl, imageLocalUri) {
  const product = base.getById(id);
  if (
    !product ||
    product.imageRemoteUrl !== imageRemoteUrl ||
    product.syncStatus === 'pending' ||
    product.syncStatus === 'conflict'
  ) return false;
  db.update(products).set({ imageLocalUri }).where(eq(products.id, id)).run();
  return true;
}

export const productRepository = {
  ...base,
  adjustStock,
  listLowStock,
  setImageRemoteUrl,
  replaceLocalImageUri,
  setCachedImage,
};
