import { File } from 'expo-file-system';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { shops } from '../db/schema';
import { shopRepository } from '../db/repositories/shopRepository';
import { cacheRemoteProductImage } from './productImages';

const inFlight = new Map();
export function cacheShopLogos(rows) {
  for (const row of rows) {
    const shop = shopRepository.getById(row.id);
    if (!shop?.logoRemoteUrl || inFlight.has(shop.id)) continue;
    if (shop.logoLocalUri && new File(shop.logoLocalUri).exists) continue;
    const task = cacheRemoteProductImage(shop.logoRemoteUrl, `shop-${shop.id}`).then((uri) => {
      if (shopRepository.getById(shop.id)?.logoRemoteUrl === shop.logoRemoteUrl) {
        db.update(shops).set({ logoLocalUri: uri }).where(eq(shops.id, shop.id)).run();
      }
    }).catch(() => {}).finally(() => inFlight.delete(shop.id));
    inFlight.set(shop.id, task);
  }
}
