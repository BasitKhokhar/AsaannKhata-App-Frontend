import { eq, and, desc } from 'drizzle-orm';
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

export const stockRepository = {
  ...base,
  listByProduct,
};
