import { eq, and, desc } from 'drizzle-orm';
import { db } from '../client';
import { randomUUID } from 'expo-crypto';

// Factory for the repeated CRUD+sync shape shared by categories/products/
// customers (soft-deletable, updatable) and stock_transactions/
// customer_payments (append-only, no update/delete branch).
//
// Every row created here gets its `id` as a fresh UUID up front — that UUID
// IS the `clientId` this row will be pushed to the backend under, so local
// FKs referencing it never need remapping once a `serverId` comes back.
export function createSyncableRepository(table, { appendOnly = false } = {}) {
  function nowIso() {
    return new Date().toISOString();
  }

  function listByShop(shopId, { includeDeleted = false } = {}) {
    const conditions = [eq(table.shopId, shopId)];
    if (!appendOnly && !includeDeleted) conditions.push(eq(table.isDeleted, false));
    return db
      .select()
      .from(table)
      .where(and(...conditions))
      .orderBy(desc(table.createdAt))
      .all();
  }

  function getById(id) {
    return db.select().from(table).where(eq(table.id, id)).get();
  }

  function create(data) {
    const id = data.id || randomUUID();
    const timestamp = nowIso();
    const row = {
      ...data,
      id,
      createdAt: data.createdAt || timestamp,
      syncStatus: 'pending',
      ...(appendOnly ? {} : { updatedAt: timestamp, isDeleted: false }),
    };
    db.insert(table).values(row).run();
    return row;
  }

  function update(id, data) {
    if (appendOnly) throw new Error('This table is append-only, cannot update');
    const timestamp = nowIso();
    db.update(table)
      .set({ ...data, updatedAt: timestamp, syncStatus: 'pending' })
      .where(eq(table.id, id))
      .run();
    return getById(id);
  }

  function softDelete(id) {
    if (appendOnly) throw new Error('append-only table has no delete');
    const timestamp = nowIso();
    db.update(table)
      .set({ isDeleted: true, deletedAt: timestamp, updatedAt: timestamp, syncStatus: 'pending' })
      .where(eq(table.id, id))
      .run();
  }

  // Rows the push step still needs to send — the sync engine's queue source.
  function listPending(shopId) {
    return db
      .select()
      .from(table)
      .where(and(eq(table.shopId, shopId), eq(table.syncStatus, 'pending')))
      .all();
  }

  function markSynced(id, serverId) {
    const current = getById(id);
    db.update(table).set({ syncStatus: 'synced', serverId: serverId ?? current?.serverId ?? null }).where(eq(table.id, id)).run();
  }

  function markConflict(id) {
    db.update(table).set({ syncStatus: 'conflict' }).where(eq(table.id, id)).run();
  }

  // Upsert used by the pull step — matches an incoming server row to a local
  // one by serverId first (already-synced row), falling back to clientId
  // (this exact row was created locally and is being echoed back).
  function upsertFromServer(serverRow, mapServerToLocal) {
    const local = mapServerToLocal(serverRow);
    const existingByServerId = db.select().from(table).where(eq(table.serverId, serverRow.id)).get();
    const existingByClientId = serverRow.clientId
      ? db.select().from(table).where(eq(table.id, serverRow.clientId)).get()
      : null;
    const existing = existingByServerId || existingByClientId;

    if (existing) {
      db.update(table)
        .set({ ...local, syncStatus: 'synced' })
        .where(eq(table.id, existing.id))
        .run();
      return existing.id;
    }

    const id = serverRow.clientId || randomUUID();
    db.insert(table)
      .values({ ...local, id, syncStatus: 'synced' })
      .run();
    return id;
  }

  return {
    listByShop,
    getById,
    create,
    update,
    softDelete,
    listPending,
    markSynced,
    markConflict,
    upsertFromServer,
  };
}
