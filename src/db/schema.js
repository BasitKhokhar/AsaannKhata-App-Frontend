import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// -----------------------------------------------------------------------
// Sync bookkeeping convention used on every syncable table:
//   id         TEXT PK — this IS the clientId sent to the backend (a UUID
//              generated with expo-crypto's randomUUID() at creation time).
//   serverId   INTEGER, nullable — the backend's autoincrement id, filled in
//              once this row has been pushed and accepted.
//   isDeleted / deletedAt — soft-delete tombstone, mirrors the backend.
//   deviceId   — which device last wrote this row.
//   updatedAt  — sync watermark for pull comparisons (ISO string).
//   syncStatus — 'pending' | 'synced' | 'conflict', LOCAL ONLY (never sent
//              to the backend), drives the push queue and the Sync Status UI.
// This means local foreign keys never need remapping after a round trip to
// the server — they're stable UUIDs from the moment a row is created offline.
// -----------------------------------------------------------------------

export const shops = sqliteTable('shops', {
  id: text('id').primaryKey(), // String(backend Shop.id) — shops are never created offline
  adminId: integer('admin_id').notNull(),
  shopTypeId: integer('shop_type_id').notNull(),
  shopTypeCode: text('shop_type_code'),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  logoLocalUri: text('logo_local_uri'),
  logoRemoteUrl: text('logo_remote_url'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('shops_admin_id_idx').on(table.adminId)]);

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  name: text('name').notNull(),
  imageLocalUri: text('image_local_uri'),
  imageRemoteUrl: text('image_remote_url'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('categories_shop_created_idx').on(table.shopId, table.createdAt),
  index('categories_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('categories_server_id_idx').on(table.serverId),
]);

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  categoryId: text('category_id'),
  name: text('name').notNull(),
  image: text('image'),
  stockType: text('stock_type').notNull().default('QUANTITY'), // QUANTITY | AREA | LENGTH | PACK

  stockQuantity: real('stock_quantity').notNull().default(0),

  stockAreaCm2: real('stock_area_cm2').notNull().default(0),
  sheetWidthCm: real('sheet_width_cm'),
  sheetHeightCm: real('sheet_height_cm'),
  sheetAreaCm2: real('sheet_area_cm2'),

  stockLengthCm: real('stock_length_cm').notNull().default(0),

  packSize: integer('pack_size'),
  stockPacks: real('stock_packs').notNull().default(0),
  stockLooseUnits: real('stock_loose_units').notNull().default(0),
  packPurchasePrice: real('pack_purchase_price'),
  packSalePrice: real('pack_sale_price'),

  purchasePrice: real('purchase_price').notNull(),
  salePrice: real('sale_price').notNull(),

  lowStockThreshold: real('low_stock_threshold'),

  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('products_shop_active_name_idx').on(table.shopId, table.isDeleted, table.name),
  index('products_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('products_server_id_idx').on(table.serverId),
]);

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  balance: real('balance').notNull().default(0),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('customers_shop_created_idx').on(table.shopId, table.createdAt),
  index('customers_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('customers_server_id_idx').on(table.serverId),
]);

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  occurredAt: text('occurred_at').notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('expenses_shop_occurred_idx').on(table.shopId, table.isDeleted, table.occurredAt),
  index('expenses_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('expenses_server_id_idx').on(table.serverId),
]);

export const bills = sqliteTable('bills', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  subtotal: real('subtotal').notNull().default(0),
  discount: real('discount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  totalReceived: real('total_received').notNull().default(0),
  changeDue: real('change_due').notNull().default(0),
  remainingDue: real('remaining_due').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('UNSPECIFIED'),
  status: text('status').notNull().default('PENDING'), // PENDING | PAID
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('bills_shop_created_idx').on(table.shopId, table.isDeleted, table.createdAt),
  index('bills_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('bills_server_id_idx').on(table.serverId),
]);

// No independent sync fields — items sync nested inside their parent bill's
// push payload and inherit the parent's syncStatus (matches backend BillItem).
export const billItems = sqliteTable('bill_items', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  stockType: text('stock_type').notNull(),
  quantity: real('quantity'),
  packQuantity: real('pack_quantity'),
  looseQuantity: real('loose_quantity'),
  unit: text('unit'),
  width: real('width'),
  height: real('height'),
  unitArea: real('unit_area'),
  totalArea: real('total_area'),
  lengthCm: real('length_cm'),
  pricePerUnit: real('price_per_unit').notNull(),
  total: real('total').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('bill_items_bill_id_idx').on(table.billId)]);

// Append-only, like the backend — no isDeleted/update path.
export const stockTransactions = sqliteTable('stock_transactions', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  productId: text('product_id').notNull(),
  type: text('type').notNull(), // IN | OUT | PACK_BREAK
  quantity: real('quantity').notNull(),
  price: real('price'),
  description: text('description'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('stock_transactions_shop_created_idx').on(table.shopId, table.createdAt),
  index('stock_transactions_shop_type_created_idx').on(table.shopId, table.type, table.createdAt),
  index('stock_transactions_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('stock_transactions_server_id_idx').on(table.serverId),
]);

// Append-only, like stock_transactions.
export const customerPayments = sqliteTable('customer_payments', {
  id: text('id').primaryKey(),
  serverId: integer('server_id'),
  shopId: text('shop_id').notNull(),
  customerId: text('customer_id').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  deviceId: text('device_id'),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('customer_payments_shop_created_idx').on(table.shopId, table.createdAt),
  index('customer_payments_shop_pending_idx').on(table.shopId, table.syncStatus),
  index('customer_payments_server_id_idx').on(table.serverId),
]);

// Append-only local ledger of ad-coin spending events (e.g. a bill created
// offline on the free tier) — same shape convention as stock_transactions/
// customer_payments above. Deliberately has NO shopId: unlike every other
// syncable table, a coin balance is per-account rather than per-shop, and
// the backend's fixed POST /ads/coin-usage/sync contract takes no shopId
// either — see coinUsageLogRepository.js for the minimal repo this gets
// instead of createSyncableRepository.
export const coinUsageLog = sqliteTable('coin_usage_log', {
  id: text('id').primaryKey(),
  actionType: text('action_type').notNull(), // 'BILL'
  amount: real('amount').notNull(),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

// Single-row table: this device's stable install identity + registration state.
export const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: text('device_id').notNull(),
  deviceName: text('device_name'),
  platform: text('platform'),
  registered: integer('registered', { mode: 'boolean' }).notNull().default(false),
  lastSyncAt: text('last_sync_at'),
});

// Generic key/value store — sync watermark (`lastSyncSince`), onboarding
// flags that need to be queryable alongside app data, etc.
export const syncMeta = sqliteTable('sync_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// Single-row cache of the last GET /subscriptions/me response, so entitlement
// checks work instantly offline without waiting on a network round trip.
export const entitlementCache = sqliteTable('entitlement_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id'),
  tier: text('tier'),
  planCode: text('plan_code'),
  status: text('status'),
  cloudEnabled: integer('cloud_enabled', { mode: 'boolean' }).notNull().default(false),
  offlineEnabled: integer('offline_enabled', { mode: 'boolean' }).notNull().default(true),
  maxDevices: integer('max_devices').notNull().default(1),
  expiryDate: text('expiry_date'),
  isTrial: integer('is_trial', { mode: 'boolean' }).notNull().default(false),
  canWrite: integer('can_write', { mode: 'boolean' }).notNull().default(true),
  fetchedAt: text('fetched_at'),
});
