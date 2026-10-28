import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { db, expoDb } from '../client';
import { bills, billItems, products } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';
import { productRepository } from './productRepository';
import { stockRepository } from './stockRepository';
import { customerRepository } from './customerRepository';

const base = createSyncableRepository(bills);

// Mirrors the backend's POST /billing/create transaction, but runs entirely
// against local SQLite: creates the bill + line items, decrements each sold
// product's stock, writes a StockTransaction("OUT") audit row per line, and
// — for khata sales — adds the unpaid remainder to the customer's balance.
// All local writes succeed regardless of subscription/network state; only
// the *push* of these rows to the server depends on entitlement/connectivity.
function createBillWithItems({ shopId, customerId, customerName, customerPhone, subtotal, discount, totalAmount, totalReceived, changeDue, remainingDue, paymentMethod, status, items }) {
  const timestamp = new Date().toISOString();
  const billId = randomUUID();
  let createdBill;
  expoDb.withTransactionSync(() => {

  if (customerId) {
    const customer = customerRepository.getById(customerId);
    if (!customer || customer.shopId !== shopId || customer.isDeleted) {
      throw new Error('Customer is not available in this shop');
    }
  }

  db.insert(bills)
    .values({
      id: billId,
      shopId,
      customerId: customerId || null,
      customerName,
      customerPhone: customerPhone || null,
      subtotal,
      discount,
      totalAmount,
      totalReceived,
      changeDue,
      remainingDue,
      paymentMethod: paymentMethod || 'UNSPECIFIED',
      status: status || 'PENDING',
      isDeleted: false,
      syncStatus: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  for (const item of items) {
    const billItemId = randomUUID();
    db.insert(billItems)
      .values({
        id: billItemId,
        billId,
        productId: item.productId,
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
        pricePerUnit: item.pricePerUnit,
        total: item.total,
        createdAt: timestamp,
      })
      .run();

    // Decrement stock by whichever counter this item's stockType uses.
    const product = productRepository.getById(item.productId);
    if (!product || product.shopId !== shopId || product.isDeleted) {
      throw new Error(`Product ${item.productId} is not available in this shop`);
    }
    const patch = stockPatchForSale(product, item);
    productRepository.adjustStock(item.productId, patch);

    stockRepository.create({
      id: billItemId,
      shopId,
      productId: item.productId,
      type: 'OUT',
      quantity: quantityForLog(item),
      price: item.pricePerUnit,
      description: `Sold in Bill #${billId}`,
    });
  }

  if (customerId && remainingDue > 0) {
    customerRepository.adjustBalance(customerId, remainingDue);
  }

    createdBill = getWithItems(billId);
  });
  return createdBill;
}

function stockPatchForSale(product, item) {
  switch (item.stockType) {
    case 'AREA': {
      if ((item.totalArea || 0) > (product.stockAreaCm2 || 0)) throw new Error(`Insufficient stock for ${product.name}`);
      return { stockAreaCm2: Math.max(0, (product.stockAreaCm2 || 0) - (item.totalArea || 0)) };
    }
    case 'LENGTH': {
      if ((item.lengthCm || 0) > (product.stockLengthCm || 0)) throw new Error(`Insufficient stock for ${product.name}`);
      return { stockLengthCm: Math.max(0, (product.stockLengthCm || 0) - (item.lengthCm || 0)) };
    }
    case 'PACK': {
      if ((item.packQuantity || 0) > (product.stockPacks || 0) || (item.looseQuantity || 0) > (product.stockLooseUnits || 0)) throw new Error(`Insufficient stock for ${product.name}`);
      return {
        stockPacks: Math.max(0, (product.stockPacks || 0) - (item.packQuantity || 0)),
        stockLooseUnits: Math.max(0, (product.stockLooseUnits || 0) - (item.looseQuantity || 0)),
      };
    }
    default: {
      if ((item.quantity || 0) > (product.stockQuantity || 0)) throw new Error(`Insufficient stock for ${product.name}`);
      return { stockQuantity: Math.max(0, (product.stockQuantity || 0) - (item.quantity || 0)) };
    }
  }
}

function quantityForLog(item) {
  if (item.stockType === 'AREA') return item.totalArea || 0;
  if (item.stockType === 'LENGTH') return item.lengthCm || 0;
  if (item.stockType === 'PACK') return item.packQuantity || 0;
  return item.quantity || 0;
}

function listByShop(shopId, { status } = {}) {
  const conditions = [eq(bills.shopId, shopId), eq(bills.isDeleted, false)];
  if (status && status !== 'all') conditions.push(eq(bills.status, status.toUpperCase()));
  return db
    .select()
    .from(bills)
    .where(and(...conditions))
    .orderBy(desc(bills.createdAt))
    .all();
}

function getWithItems(billId) {
  const bill = base.getById(billId);
  if (!bill) return null;
  const items = db.select().from(billItems).where(eq(billItems.billId, billId)).all();
  return { ...bill, items };
}

function listByCustomer(customerId) {
  return db
    .select()
    .from(bills)
    .where(and(eq(bills.customerId, customerId), eq(bills.isDeleted, false)))
    .orderBy(desc(bills.createdAt))
    .all();
}

export const billRepository = {
  ...base,
  createBillWithItems,
  listByShop,
  getWithItems,
  listByCustomer,
};
