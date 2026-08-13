import { eq } from 'drizzle-orm';
import { db } from '../client';
import { shops } from '../schema';

// Shops are never created offline (POST /shops/add is online-only per the
// backend) — this repository is a pure read-through cache of GET /shops/all
// so the app can show "My Shops" / the shop switcher without a network call.
function upsertMany(shopRows) {
  const timestamp = new Date().toISOString();
  for (const s of shopRows) {
    const id = String(s.id);
    const existing = db.select().from(shops).where(eq(shops.id, id)).get();
    const row = {
      id,
      adminId: s.adminId,
      shopTypeId: s.shopTypeId,
      shopTypeCode: s.shopType?.code || null,
      name: s.name,
      address: s.address || null,
      phone: s.phone || null,
      logoRemoteUrl: s.logo || null,
      updatedAt: s.updatedAt || timestamp,
      createdAt: s.createdAt || timestamp,
    };
    if (existing) {
      db.update(shops).set(row).where(eq(shops.id, id)).run();
    } else {
      db.insert(shops).values(row).run();
    }
  }
}

function listAll() {
  return db.select().from(shops).all();
}

function getById(id) {
  return db.select().from(shops).where(eq(shops.id, String(id))).get();
}

export const shopRepository = { upsertMany, listAll, getById };
