import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories, products, customers } from '../db/schema';
import { categoryRepository } from '../db/repositories/categoryRepository';
import { productRepository } from '../db/repositories/productRepository';
import { stockRepository } from '../db/repositories/stockRepository';
import { customerRepository } from '../db/repositories/customerRepository';
import { customerPaymentRepository } from '../db/repositories/customerPaymentRepository';
import { billRepository } from '../db/repositories/billRepository';
import { syncApi } from '../services/syncApi';

// The inverse of idMap.resolveLocalIdByServerId — a local UUID FK needs to
// become the referenced row's serverId before the backend (which only knows
// server ints) can accept it. Returns null if that row hasn't synced yet
// (its own push must be ordered before this one — see runSync's ordering).
function serverIdOf(table, localId) {
  if (!localId) return null;
  return db.select({ serverId: table.serverId }).from(table).where(eq(table.id, localId)).get()?.serverId ?? null;
}

function applyResults(repo, results) {
  for (const result of results) {
    if (result.status === 'created' || result.status === 'updated') {
      repo.markSynced(result.clientId, result.serverId);
    } else if (result.status === 'conflict') {
      repo.markConflict(result.clientId);
    }
    // 'error' rows are left 'pending' for the next sync attempt.
  }
}

async function pushPendingCategories(shopId, deviceId) {
  const pending = categoryRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending.map((row) => ({
    clientId: row.id,
    operationType: row.isDeleted ? 'DELETE' : 'UPSERT',
    payload: { name: row.name, image: row.imageRemoteUrl },
    baseUpdatedAt: row.updatedAt,
  }));
  const { results } = await syncApi.pushCategories(deviceId, operations);
  applyResults(categoryRepository, results);
}

async function pushPendingProducts(shopId, deviceId) {
  const pending = productRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending.map((row) => ({
    clientId: row.id,
    operationType: row.isDeleted ? 'DELETE' : 'UPSERT',
    payload: {
      categoryId: serverIdOf(categories, row.categoryId),
      name: row.name,
      image: row.image,
      stockType: row.stockType,
      stockQuantity: row.stockQuantity,
      stockAreaCm2: row.stockAreaCm2,
      sheetWidthCm: row.sheetWidthCm,
      sheetHeightCm: row.sheetHeightCm,
      sheetAreaCm2: row.sheetAreaCm2,
      stockLengthCm: row.stockLengthCm,
      packSize: row.packSize,
      stockPacks: row.stockPacks,
      stockLooseUnits: row.stockLooseUnits,
      packPurchasePrice: row.packPurchasePrice,
      packSalePrice: row.packSalePrice,
      purchasePrice: row.purchasePrice,
      salePrice: row.salePrice,
    },
    baseUpdatedAt: row.updatedAt,
  }));
  const { results } = await syncApi.pushProducts(deviceId, operations);
  applyResults(productRepository, results);
}

async function pushPendingStockAdjustments(shopId, deviceId) {
  const pending = stockRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending
    .map((row) => {
      const productServerId = serverIdOf(products, row.productId);
      if (!productServerId) return null; // product hasn't synced yet — retry next round
      return {
        clientId: row.id,
        operationType: 'CREATE',
        payload: { productId: productServerId, type: row.type, quantity: row.quantity, price: row.price, description: row.description },
      };
    })
    .filter(Boolean);
  if (!operations.length) return;
  const { results } = await syncApi.pushStockAdjustments(deviceId, operations);
  applyResults(stockRepository, results);
}

async function pushPendingCustomers(shopId, deviceId) {
  const pending = customerRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending.map((row) => ({
    clientId: row.id,
    operationType: row.isDeleted ? 'DELETE' : 'UPSERT',
    payload: { name: row.name, phone: row.phone },
    baseUpdatedAt: row.updatedAt,
  }));
  const { results } = await syncApi.pushCustomers(deviceId, operations);
  applyResults(customerRepository, results);
}

async function pushPendingBills(shopId, deviceId) {
  const pending = billRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending
    .map((row) => {
      const bill = billRepository.getWithItems(row.id);
      const items = bill.items.map((item) => ({ ...item, productId: serverIdOf(products, item.productId) }));
      if (items.some((i) => !i.productId)) return null; // a line's product hasn't synced yet — retry next round
      return {
        clientId: row.id,
        operationType: 'CREATE',
        payload: {
          customerId: serverIdOf(customers, row.customerId),
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          subtotal: row.subtotal,
          discount: row.discount,
          totalAmount: row.totalAmount,
          totalReceived: row.totalReceived,
          changeDue: row.changeDue,
          remainingDue: row.remainingDue,
          status: row.status,
          items,
        },
      };
    })
    .filter(Boolean);
  if (!operations.length) return;
  const { results } = await syncApi.pushBills(deviceId, operations);
  applyResults(billRepository, results);
}

async function pushPendingCustomerPayments(shopId, deviceId) {
  const pending = customerPaymentRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending
    .map((row) => {
      const customerServerId = serverIdOf(customers, row.customerId);
      if (!customerServerId) return null;
      return { clientId: row.id, operationType: 'CREATE', payload: { customerId: customerServerId, amount: row.amount, note: row.note } };
    })
    .filter(Boolean);
  if (!operations.length) return;
  const { results } = await syncApi.pushCustomerPayments(deviceId, operations);
  applyResults(customerPaymentRepository, results);
}

// Order matters for FK resolution: a row can only be pushed once whatever
// it references (category, product, customer) already has a serverId.
export async function pushAllPending(shopId, deviceId) {
  await pushPendingCategories(shopId, deviceId);
  await pushPendingProducts(shopId, deviceId);
  await pushPendingStockAdjustments(shopId, deviceId);
  await pushPendingCustomers(shopId, deviceId);
  await pushPendingBills(shopId, deviceId);
  await pushPendingCustomerPayments(shopId, deviceId);
}
