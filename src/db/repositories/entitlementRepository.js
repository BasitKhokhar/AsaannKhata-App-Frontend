import { eq } from 'drizzle-orm';
import { db } from '../client';
import { entitlementCache } from '../schema';

// Once a paid entitlement has ended, the user keeps the local/offline Free
// experience. The old paid row remains in the backend subscription history;
// this is only the effective entitlement used by the app UI and local gates.
function freeEntitlement(fetchedAt = new Date().toISOString()) {
  return {
    subscriptionId: null,
    tier: 'FREE_TRIAL',
    planCode: 'FREE_TRIAL',
    status: 'ACTIVE',
    cloudEnabled: false,
    offlineEnabled: true,
    maxDevices: 1,
    expiryDate: null,
    isTrial: true,
    canWrite: true,
    fetchedAt,
  };
}

function isExpired(entitlement) {
  if (!entitlement) return false;
  if (String(entitlement.status || '').toUpperCase() === 'EXPIRED') return true;
  if (!entitlement.expiryDate) return false;
  const expiry = new Date(entitlement.expiryDate).getTime();
  return Number.isFinite(expiry) && expiry <= Date.now();
}

function effective(entitlement) {
  if (!entitlement) return null;
  const status = String(entitlement.status || '').toUpperCase();
  if (status === 'NONE' || isExpired(entitlement) || entitlement.canWrite === false) {
    return freeEntitlement(entitlement.fetchedAt);
  }
  return entitlement;
}

// Single-row cache of GET /subscriptions/me — read synchronously by any
// screen that needs to know `canWrite`/`cloudEnabled` without waiting on a
// network round trip (critical for the app's offline-first guarantee).
function get() {
  const cached = db.select().from(entitlementCache).get() ?? null;
  return effective(cached);
}

function save(entitlement) {
  const existing = db.select().from(entitlementCache).get();
  const resolved = effective({ ...entitlement, fetchedAt: new Date().toISOString() });
  const row = {
    subscriptionId: resolved.subscriptionId ?? null,
    tier: resolved.tier ?? null,
    planCode: resolved.planCode ?? null,
    status: resolved.status ?? null,
    cloudEnabled: !!resolved.cloudEnabled,
    offlineEnabled: resolved.offlineEnabled !== false,
    maxDevices: resolved.maxDevices ?? 1,
    expiryDate: resolved.expiryDate ?? null,
    isTrial: !!resolved.isTrial,
    canWrite: resolved.canWrite !== false,
    fetchedAt: resolved.fetchedAt,
  };
  if (existing) {
    db.update(entitlementCache).set(row).where(eq(entitlementCache.id, existing.id)).run();
  } else {
    db.insert(entitlementCache).values(row).run();
  }
  return row;
}

function clear() {
  db.delete(entitlementCache).run();
}

export const entitlementRepository = { get, save, clear };
