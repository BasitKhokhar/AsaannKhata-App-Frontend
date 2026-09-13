import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { db } from '../client';
import { coinUsageLog } from '../schema';

// Append-only local ledger of ad-coin spends (e.g. a bill created offline on
// the free tier). Deliberately NOT built on createSyncableRepository: unlike
// every other syncable table this one isn't shop-scoped — a coin balance is
// per-account, not per-shop — and the backend's POST /ads/coin-usage/sync
// contract takes no shopId either, so it gets its own minimal
// insert/listPending/markSynced shape instead of the shared factory.
function create({ actionType, amount }) {
  const row = {
    id: randomUUID(),
    actionType,
    amount,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.insert(coinUsageLog).values(row).run();
  return row;
}

// Rows the coin-usage push step still needs to send — see
// pushPendingCoinUsage() in src/sync/push.js.
function listPending() {
  return db.select().from(coinUsageLog).where(eq(coinUsageLog.syncStatus, 'pending')).all();
}

function markSynced(id) {
  db.update(coinUsageLog).set({ syncStatus: 'synced' }).where(eq(coinUsageLog.id, id)).run();
}

export const coinUsageLogRepository = { create, listPending, markSynced };
