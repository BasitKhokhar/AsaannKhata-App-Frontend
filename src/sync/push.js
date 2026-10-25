import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories, products, customers } from '../db/schema';
import { categoryRepository } from '../db/repositories/categoryRepository';
import { productRepository } from '../db/repositories/productRepository';
import { stockRepository } from '../db/repositories/stockRepository';
import { customerRepository } from '../db/repositories/customerRepository';
import { customerPaymentRepository } from '../db/repositories/customerPaymentRepository';
import { billRepository } from '../db/repositories/billRepository';
import { expenseRepository } from '../db/repositories/expenseRepository';
import { coinUsageLogRepository } from '../db/repositories/coinUsageLogRepository';
import { syncApi } from '../services/syncApi';
import { adsApi } from '../services/adsApi';
import { useCoinsStore } from '../store/coinsStore';

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
    if (result.status === 'created' || result.status === 'updated' || result.status === 'deleted') {
      repo.markSynced(result.clientId, result.serverId);
    } else if (result.status === 'conflict') {
      repo.markConflict(result.clientId);
    }
    // 'error' rows are left 'pending' for the next sync attempt.
  }
}

const PUSH_BATCH_SIZE = 100;

async function pushBatches(shopId, deviceId, operations, send, repo) {
  for (let offset = 0; offset < operations.length; offset += PUSH_BATCH_SIZE) {
    const batch = operations.slice(offset, offset + PUSH_BATCH_SIZE);
    const { results } = await send(shopId, deviceId, batch);
    applyResults(repo, results);
    if (results.some((result) => result.status === 'error' || result.status === 'conflict')) {
      throw new Error('Some records could not be synchronized; pending or conflicted records remain on this device');
    }
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
  await pushBatches(shopId, deviceId, operations, syncApi.pushCategories, categoryRepository);
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
      lowStockThreshold: row.lowStockThreshold,
    },
    baseUpdatedAt: row.updatedAt,
  }));
  await pushBatches(shopId, deviceId, operations, syncApi.pushProducts, productRepository);
}

async function pushPendingStockAdjustments(shopId, deviceId) {
  const pending = stockRepository.listPending(shopId);
  if (!pending.length) return;
  let deferred = 0;
  const operations = pending
    .map((row) => {
      // Sale logs are carried with their bill, which creates the matching
      // server ledger row. Pushing them here would duplicate the sale.
      const saleBillId = /^Sold in Bill #(.+)$/.exec(row.description || '')?.[1];
      if (saleBillId && billRepository.getById(saleBillId)) return null;
      const productServerId = serverIdOf(products, row.productId);
      if (!productServerId) {
        deferred += 1;
        return null;
      }
      return {
        clientId: row.id,
        operationType: 'CREATE',
        payload: { productId: productServerId, type: row.type, quantity: row.quantity, price: row.price, description: row.description },
      };
    })
    .filter(Boolean);
  await pushBatches(shopId, deviceId, operations, syncApi.pushStockAdjustments, stockRepository);
  if (deferred) throw new Error('Some stock adjustments are waiting for their products to sync');
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
  await pushBatches(shopId, deviceId, operations, syncApi.pushCustomers, customerRepository);
}

async function pushPendingBills(shopId, deviceId) {
  const pending = billRepository.listPending(shopId);
  if (!pending.length) return;
  const saleLogsByBill = new Map();
  for (const log of stockRepository.listPending(shopId).reverse()) {
    const billId = /^Sold in Bill #(.+)$/.exec(log.description || '')?.[1];
    if (!billId) continue;
    const logs = saleLogsByBill.get(billId) || [];
    logs.push(log);
    saleLogsByBill.set(billId, logs);
  }
  const operations = pending
    .map((row) => {
      const bill = billRepository.getWithItems(row.id);
      // Older local bills used separate UUIDs for their sale logs. Match them
      // by bill/product in creation order; new bills use the item UUID itself.
      const saleLogs = [...(saleLogsByBill.get(row.id) || [])];
      const items = bill.items.map((item) => {
        const exactLogIndex = saleLogs.findIndex((log) => log.id === item.id);
        const logIndex = exactLogIndex >= 0 ? exactLogIndex : saleLogs.findIndex((log) => log.productId === item.productId);
        const log = logIndex >= 0 ? saleLogs.splice(logIndex, 1)[0] : null;
        return { ...item, productId: serverIdOf(products, item.productId), stockTransactionClientId: log?.id || item.id };
      });
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
          paymentMethod: row.paymentMethod,
          status: row.status,
          items,
        },
      };
    })
    .filter(Boolean);
  await pushBatches(shopId, deviceId, operations, syncApi.pushBills, billRepository);
  if (operations.length !== pending.length) {
    throw new Error('Some bills are waiting for their products to sync');
  }
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
  await pushBatches(shopId, deviceId, operations, syncApi.pushCustomerPayments, customerPaymentRepository);
  if (operations.length !== pending.length) {
    throw new Error('Some customer payments are waiting for their customers to sync');
  }
}

async function pushPendingExpenses(shopId, deviceId) {
  const pending = expenseRepository.listPending(shopId);
  if (!pending.length) return;
  const operations = pending.map((row) => ({
    clientId: row.id,
    operationType: row.isDeleted ? 'DELETE' : 'UPSERT',
    payload: { category: row.category, amount: row.amount, note: row.note, occurredAt: row.occurredAt },
    baseUpdatedAt: row.updatedAt,
  }));
  await pushBatches(shopId, deviceId, operations, syncApi.pushExpenses, expenseRepository);
}

// Reconciles this device's local coin-usage ledger (see
// src/db/repositories/coinUsageLogRepository.js — e.g. a bill created
// offline on the free tier) with the backend's authoritative coin balance.
// Deliberately NOT called from pushAllPending: syncEngine.runSync() calls
// this one unconditionally, before its cloudEnabled gate, because a
// free-tier user must always be able to true up their coin balance even
// when full record sync is locked. Errors (offline, backend down) are
// swallowed — rows stay 'pending' and are retried on the next runSync.
export async function pushPendingCoinUsage() {
  const pending = coinUsageLogRepository.listPending();
  if (!pending.length) return;

  const operations = pending.map((row) => ({
    clientId: row.id,
    actionType: row.actionType,
    amount: row.amount,
    createdAt: row.createdAt,
  }));

  try {
    const { results } = await adsApi.syncCoinUsage(operations);
    let latestAdCoins;
    for (const result of results) {
      if (result.success) {
        coinUsageLogRepository.markSynced(result.clientId);
        if (result.adCoins != null) latestAdCoins = result.adCoins;
      }
      // Unsuccessful rows are left 'pending' for the next sync attempt.
    }
    if (latestAdCoins != null) useCoinsStore.setState({ adCoins: latestAdCoins });
  } catch (err) {
    // Offline or backend error — every row stays 'pending'.
  }
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
  await pushPendingExpenses(shopId, deviceId);
}
