import { eq } from 'drizzle-orm';
import { db } from '../client';
import { devices } from '../schema';
import { randomUUID } from 'expo-crypto';

// Single-row table — this install's stable device identity. Created lazily
// on first read so a UUID is generated once and never changes for this app
// install (registered with the backend the first time cloud sync is used).
function getOrCreate() {
  const existing = db.select().from(devices).get();
  if (existing) return existing;

  const row = { deviceId: randomUUID(), registered: false };
  const [inserted] = db.insert(devices).values(row).returning().all();
  return inserted;
}

function markRegistered({ deviceName, platform } = {}) {
  const current = getOrCreate();
  db.update(devices)
    .set({ registered: true, deviceName: deviceName ?? current.deviceName, platform: platform ?? current.platform })
    .where(eq(devices.id, current.id))
    .run();
}

function markSynced() {
  const current = getOrCreate();
  db.update(devices)
    .set({ lastSyncAt: new Date().toISOString() })
    .where(eq(devices.id, current.id))
    .run();
}

export const deviceRepository = { getOrCreate, markRegistered, markSynced };
