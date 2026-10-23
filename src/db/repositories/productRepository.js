import { eq } from 'drizzle-orm';
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

export const productRepository = {
  ...base,
  adjustStock,
  listLowStock,
};
