import { eq, and, desc, lt, or } from 'drizzle-orm';
import { db } from '../client';
import { stockTransactions } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';

const base = createSyncableRepository(stockTransactions, { appendOnly: true });

function listByProduct(productId) {
  return db
    .select()
    .from(stockTransactions)
    .where(eq(stockTransactions.productId, productId))
    .orderBy(desc(stockTransactions.createdAt))
    .all();
}

function listPageByShop(shopId, { type, limit = 100, cursor } = {}) {
  const conditions = [eq(stockTransactions.shopId, shopId)];
  if (type && type !== 'all') conditions.push(eq(stockTransactions.type, type));
  if (cursor) {
    conditions.push(or(
      lt(stockTransactions.createdAt, cursor.createdAt),
      and(eq(stockTransactions.createdAt, cursor.createdAt), lt(stockTransactions.id, cursor.id))
    ));
  }
  return db
    .select()
    .from(stockTransactions)
    .where(and(...conditions))
    .orderBy(desc(stockTransactions.createdAt), desc(stockTransactions.id))
    .limit(limit)
    .all();
}

export const stockRepository = {
  ...base,
  listByProduct,
  listPageByShop,
};
