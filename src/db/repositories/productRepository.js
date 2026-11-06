import { barcodeFields, normalizeBarcode, productSearchTokens } from '../../utils/barcodes';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { db, expoDb } from '../client';
import { products } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';
import { isLowStock } from '../../utils/stock';

const base = createSyncableRepository(products);

// Stock counters live on the product row itself (matches the backend), so
// stock in/out/pack-break adjustments update this table directly — always
// paired with a stock_transactions row via stockRepository for the audit log.
function adjustStock(id, patch) {
  db.update(products)
    .set({ ...patch, updatedAt: new Date().toISOString(), syncStatus: 'pending' })
    .where(eq(products.id, id))
    .run();
  return base.getById(id);
}

function listLowStock(shopId) {
  return base.listByShop(shopId).filter(isLowStock);
}

function setImageRemoteUrl(id, expectedLocalUri, imageRemoteUrl) {
  const product = base.getById(id);
  if (!product || product.imageLocalUri !== expectedLocalUri) return false;
  db.update(products)
    .set({ imageRemoteUrl })
    .where(and(eq(products.id, id), eq(products.imageLocalUri, expectedLocalUri)))
    .run();
  return true;
}

function replaceLocalImageUri(id, expectedLocalUri, imageLocalUri) {
  const product = base.getById(id);
  if (!product || product.imageLocalUri !== expectedLocalUri) return false;
  db.update(products)
    .set({ imageLocalUri, imageRemoteUrl: null })
    .where(and(eq(products.id, id), eq(products.imageLocalUri, expectedLocalUri)))
    .run();
  return true;
}

function setCachedImage(id, imageRemoteUrl, imageLocalUri) {
  const product = base.getById(id);
  if (
    !product ||
    product.imageRemoteUrl !== imageRemoteUrl ||
    product.syncStatus === 'pending' ||
    product.syncStatus === 'conflict'
  ) return false;
  db.update(products).set({ imageLocalUri }).where(eq(products.id, id)).run();
  return true;
}

// Explicit projection preserves the JS field names without mapping whole catalogs.
const projection = Object.entries(getTableColumns(products)).map(([key, column]) => `p."${column.name}" AS "${key}"`).join(', ');

function findByBarcode(shopId, value) {
  const code = normalizeBarcode(value);
  if (!shopId || !code) return null;
  return expoDb.getFirstSync(`SELECT ${projection}, b.unit AS barcodeUnit
    FROM product_barcodes b JOIN products p ON p.id = b.product_id
    WHERE b.shop_id = ? AND b.code = ? AND p.shop_id = ? AND p.is_deleted = 0 LIMIT 1`, String(shopId), code, String(shopId));
}

async function searchPage(shopId, { search = '', categoryId, lowStock = false, cursor, limit = 60 } = {}) {
  if (!shopId) return { rows: [], nextCursor: undefined };
  const size = Math.max(1, Math.min(100, limit));
  const where = ['p.shop_id = ?', 'p.is_deleted = 0'];
  const args = [String(shopId)];
  const tokens = productSearchTokens(search.trim());
  if (search.trim()) {
    // FTS handles token-prefix name search; barcode equality uses its own index.
    where.push(`p.id IN (SELECT product_id FROM product_barcodes WHERE shop_id = ? AND code = ?${tokens ? ' UNION SELECT product_id FROM product_search WHERE product_search MATCH ?' : ''})`);
    args.push(String(shopId), normalizeBarcode(search) || '');
    if (tokens) args.push(tokens);
  }
  if (categoryId) { where.push('p.category_id = ?'); args.push(categoryId); }
  if (lowStock) where.push(`p.low_stock_threshold IS NOT NULL AND (CASE p.stock_type WHEN 'AREA' THEN p.stock_area_cm2 WHEN 'LENGTH' THEN p.stock_length_cm WHEN 'PACK' THEN p.stock_packs + p.stock_loose_units ELSE p.stock_quantity END) <= p.low_stock_threshold`);
  if (cursor) { where.push('(p.name, p.id) > (?, ?)'); args.push(cursor.name, cursor.id); }
  const rows = await expoDb.getAllAsync(`SELECT ${projection} FROM products p WHERE ${where.join(' AND ')} ORDER BY p.name, p.id LIMIT ?`, ...args, size + 1);
  const hasMore = rows.length > size;
  if (hasMore) rows.pop();
  const last = rows[rows.length - 1];
  return { rows, nextCursor: hasMore ? { name: last.name, id: last.id } : undefined };
}

function validateCodes(fields, existing) {
  const codes = barcodeFields(fields, existing);
  for (const code of [codes.barcode, codes.looseBarcode]) {
    const match = code && findByBarcode(fields.shopId || existing?.shopId, code);
    if (match && match.id !== existing?.id) throw new Error('barcode.duplicate');
  }
  return codes;
}

export const productRepository = {
  ...base,
  create(fields) { return base.create({ ...fields, ...validateCodes(fields) }); },
  update(id, fields) {
    const existing = base.getById(id);
    return base.update(id, { ...fields, ...validateCodes(fields, existing) });
  },
  async counts(shopId) {
    return expoDb.getFirstAsync(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN low_stock_threshold IS NOT NULL AND
      (CASE stock_type WHEN 'AREA' THEN stock_area_cm2 WHEN 'LENGTH' THEN stock_length_cm WHEN 'PACK' THEN stock_packs + stock_loose_units ELSE stock_quantity END) <= low_stock_threshold
      THEN 1 ELSE 0 END), 0) AS lowStock FROM products WHERE shop_id = ? AND is_deleted = 0`, String(shopId));
  },
  findByBarcode,
  searchPage,
  adjustStock,
  listLowStock,
  setImageRemoteUrl,
  replaceLocalImageUri,
  setCachedImage,
};
