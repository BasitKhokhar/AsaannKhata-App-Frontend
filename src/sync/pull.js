import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories, products, bills, billItems, stockTransactions, customers, customerPayments } from '../db/schema';
import { resolveLocalIdByServerId } from './idMap';

// Finds the existing local row for an incoming server row (matched by
// serverId if this device has seen it before, else by clientId if THIS
// device created it and is now seeing its own write echoed back), and
// upserts `local` into it — marking the row 'synced' either way, since by
// definition a pulled row reflects the server's current state.
function upsert(table, serverRow, local) {
  const byServerId = db.select().from(table).where(eq(table.serverId, serverRow.id)).get();
  const byClientId = serverRow.clientId ? db.select().from(table).where(eq(table.id, serverRow.clientId)).get() : null;
  const existing = byServerId || byClientId;

  if (existing) {
    // A server snapshot fetched before our pending writes are pushed must
    // never replace local edits or mark them synced. The next pull after a
    // successful push can reconcile the echoed server row.
    if (existing.syncStatus === 'pending' || existing.syncStatus === 'conflict') return existing.id;
    db.update(table).set({ ...local, syncStatus: 'synced' }).where(eq(table.id, existing.id)).run();
    return existing.id;
  }

  const id = serverRow.clientId || String(serverRow.id);
  db.insert(table).values({ ...local, id, syncStatus: 'synced' }).run();
  return id;
}

function upsertCategory(row) {
  upsert(categories, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    name: row.name,
    imageRemoteUrl: row.image || null,
    isDeleted: !!row.isDeleted,
    deletedAt: row.deletedAt || null,
    deviceId: row.deviceId || null,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  });
}

function upsertProduct(row) {
  const localCategoryId = row.categoryId ? resolveLocalIdByServerId(categories, row.categoryId) : null;
  upsert(products, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    categoryId: localCategoryId,
    name: row.name,
    image: row.image || null,
    stockType: row.stockType,
    stockQuantity: row.stockQuantity ?? 0,
    stockAreaCm2: row.stockAreaCm2 ?? 0,
    sheetWidthCm: row.sheetWidthCm ?? null,
    sheetHeightCm: row.sheetHeightCm ?? null,
    sheetAreaCm2: row.sheetAreaCm2 ?? null,
    stockLengthCm: row.stockLengthCm ?? 0,
    packSize: row.packSize ?? null,
    stockPacks: row.stockPacks ?? 0,
    stockLooseUnits: row.stockLooseUnits ?? 0,
    packPurchasePrice: row.packPurchasePrice ?? null,
    packSalePrice: row.packSalePrice ?? null,
    purchasePrice: row.purchasePrice,
    salePrice: row.salePrice,
    isDeleted: !!row.isDeleted,
    deletedAt: row.deletedAt || null,
    deviceId: row.deviceId || null,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  });
}

function upsertCustomer(row) {
  upsert(customers, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    name: row.name,
    phone: row.phone || null,
    balance: row.balance ?? 0,
    isDeleted: !!row.isDeleted,
    deletedAt: row.deletedAt || null,
    deviceId: row.deviceId || null,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  });
}

function upsertBill(row) {
  const localCustomerId = row.customerId ? resolveLocalIdByServerId(customers, row.customerId) : null;
  const billLocalId = upsert(bills, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    customerId: localCustomerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone || null,
    subtotal: row.subtotal ?? 0,
    discount: row.discount ?? 0,
    totalAmount: row.totalAmount ?? 0,
    totalReceived: row.totalReceived ?? 0,
    changeDue: row.changeDue ?? 0,
    remainingDue: row.remainingDue ?? 0,
    status: row.status || 'PENDING',
    isDeleted: !!row.isDeleted,
    deletedAt: row.deletedAt || null,
    deviceId: row.deviceId || null,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  });

  const localBill = db.select({ syncStatus: bills.syncStatus }).from(bills).where(eq(bills.id, billLocalId)).get();
  if (localBill?.syncStatus === 'pending' || localBill?.syncStatus === 'conflict') return;

  // Bill items sync nested inside their parent bill — replace this bill's
  // local items wholesale with the server's current set (simpler and safe
  // since items have no independent identity a user could be mid-editing).
  db.delete(billItems).where(eq(billItems.billId, billLocalId)).run();
  for (const item of row.items || []) {
    const localProductId = resolveLocalIdByServerId(products, item.productId) || String(item.productId);
    db.insert(billItems)
      .values({
        id: `${billLocalId}-${item.id}`,
        billId: billLocalId,
        productId: localProductId,
        productName: item.productName,
        stockType: item.stockType,
        quantity: item.quantity ?? null,
        packQuantity: item.packQuantity ?? null,
        looseQuantity: item.looseQuantity ?? null,
        unit: item.unit ?? null,
        width: item.width ?? null,
        height: item.height ?? null,
        unitArea: item.unitArea ?? null,
        totalArea: item.totalArea ?? null,
        lengthCm: item.lengthCm ?? null,
        pricePerUnit: item.pricePerUnit ?? 0,
        total: item.total ?? 0,
        createdAt: item.createdAt || row.createdAt,
      })
      .run();
  }
}

function upsertStockTransaction(row) {
  const localProductId = resolveLocalIdByServerId(products, row.productId) || String(row.productId);
  upsert(stockTransactions, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    productId: localProductId,
    type: row.type,
    quantity: row.quantity ?? 0,
    price: row.price ?? null,
    description: row.description || null,
    deviceId: row.deviceId || null,
    createdAt: row.createdAt,
  });
}

function upsertCustomerPayment(row) {
  const localCustomerId = resolveLocalIdByServerId(customers, row.customerId) || String(row.customerId);
  upsert(customerPayments, row, {
    serverId: row.id,
    shopId: String(row.shopId),
    customerId: localCustomerId,
    amount: row.amount ?? 0,
    note: row.note || null,
    deviceId: row.deviceId || null,
    createdAt: row.createdAt,
  });
}

// Order matters: categories/customers before products/bills that reference
// them, products before bill items/stock transactions that reference them.
export function applyPullPage(page) {
  (page.categories || []).forEach(upsertCategory);
  (page.customers || []).forEach(upsertCustomer);
  (page.products || []).forEach(upsertProduct);
  (page.bills || []).forEach(upsertBill);
  (page.stockTransactions || []).forEach(upsertStockTransaction);
  (page.customerPayments || []).forEach(upsertCustomerPayment);
}
