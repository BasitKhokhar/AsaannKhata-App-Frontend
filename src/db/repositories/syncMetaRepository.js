import { eq } from 'drizzle-orm';
import { db } from '../client';
import { syncMeta } from '../schema';

function get(key) {
  return db.select().from(syncMeta).where(eq(syncMeta.key, key)).get()?.value ?? null;
}

function set(key, value) {
  const existing = db.select().from(syncMeta).where(eq(syncMeta.key, key)).get();
  if (existing) {
    db.update(syncMeta).set({ value }).where(eq(syncMeta.key, key)).run();
  } else {
    db.insert(syncMeta).values({ key, value }).run();
  }
}

export const syncMetaRepository = { get, set };
