import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { customers } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';

const base = createSyncableRepository(customers);

// Mirrors the backend's adjustCustomerBalance — called alongside every local
// bill/payment write that touches a customer's khata balance, keeping the
// local ledger consistent the same way the server-side one is.
function adjustBalance(id, delta) {
  db.update(customers)
    .set({ balance: sql`${customers.balance} + ${delta}`, updatedAt: new Date().toISOString(), syncStatus: 'pending' })
    .where(eq(customers.id, id))
    .run();
}

function totalOutstanding(shopId) {
  const row = db
    .select({ total: sql`coalesce(sum(${customers.balance}), 0)` })
    .from(customers)
    .where(eq(customers.shopId, shopId))
    .get();
  return row?.total ?? 0;
}

export const customerRepository = {
  ...base,
  adjustBalance,
  totalOutstanding,
};
