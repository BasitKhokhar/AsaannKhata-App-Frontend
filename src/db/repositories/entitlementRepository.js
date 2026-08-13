import { eq } from 'drizzle-orm';
import { db } from '../client';
import { entitlementCache } from '../schema';

// Single-row cache of GET /subscriptions/me — read synchronously by any
// screen that needs to know `canWrite`/`cloudEnabled` without waiting on a
// network round trip (critical for the app's offline-first guarantee).
function get() {
  return db.select().from(entitlementCache).get() ?? null;
}

function save(entitlement) {
  const existing = db.select().from(entitlementCache).get();
  const row = {
    subscriptionId: entitlement.subscriptionId ?? null,
    tier: entitlement.tier ?? null,
    planCode: entitlement.planCode ?? null,
    status: entitlement.status ?? null,
    cloudEnabled: !!entitlement.cloudEnabled,
    offlineEnabled: entitlement.offlineEnabled !== false,
    maxDevices: entitlement.maxDevices ?? 1,
    expiryDate: entitlement.expiryDate ?? null,
    isTrial: !!entitlement.isTrial,
    canWrite: entitlement.canWrite !== false,
    fetchedAt: new Date().toISOString(),
  };
  if (existing) {
    db.update(entitlementCache).set(row).where(eq(entitlementCache.id, existing.id)).run();
  } else {
    db.insert(entitlementCache).values(row).run();
  }
}

export const entitlementRepository = { get, save };
