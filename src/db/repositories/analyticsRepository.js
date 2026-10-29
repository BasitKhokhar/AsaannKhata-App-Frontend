import { eq, and, gte, inArray, sql } from 'drizzle-orm';
import { db } from '../client';
import { bills, billItems, products, expenses } from '../schema';
import { isLowStock } from '../../utils/stock';

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// Fetch line items in bounded groups instead of one query per bill. The join
// also obtains the current cost basis used by the existing profit estimate.
function loadBillItems(billRows) {
  const result = [];
  for (let offset = 0; offset < billRows.length; offset += 500) {
    const ids = billRows.slice(offset, offset + 500).map((bill) => bill.id);
    result.push(...db.select({
      item: billItems,
      purchasePrice: products.purchasePrice,
      packPurchasePrice: products.packPurchasePrice,
      packSize: products.packSize,
    })
      .from(billItems)
      .leftJoin(products, eq(products.id, billItems.productId))
      .where(inArray(billItems.billId, ids))
      .all());
  }
  return result;
}

function lineCost(item, { purchasePrice, packPurchasePrice, packSize }) {
  if (purchasePrice == null) return null;
  if (item.stockType === 'PACK') {
    const packCost = packPurchasePrice ?? purchasePrice * (packSize || 1);
    return (item.packQuantity || 0) * packCost + (item.looseQuantity || 0) * purchasePrice;
  }
  return purchasePrice * (item.quantity ?? item.totalArea ?? item.lengthCm ?? 0);
}

// Sales Report screen — period is 'week' | 'month'. Entirely local, since
// this is a device-level analytics view, not something the backend exposes.
export function computeSalesReport(shopId, period = 'week') {
  const since = period === 'month' ? daysAgoIso(30) : daysAgoIso(7);

  const periodBills = db
    .select()
    .from(bills)
    .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false), gte(bills.createdAt, since)))
    .all();

  const revenue = periodBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const productTotals = new Map();
  let grossProfit = 0;

  for (const row of loadBillItems(periodBills)) {
    const { item } = row;
    productTotals.set(item.productName, (productTotals.get(item.productName) || 0) + item.total);
    const cost = lineCost(item, row);
    if (cost != null) {
      grossProfit += (item.total || 0) - cost;
    }
  }
  grossProfit -= periodBills.reduce((sum, bill) => sum + (bill.discount || 0), 0);

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  const expenseRows = db.select().from(expenses).where(and(eq(expenses.shopId, shopId), eq(expenses.isDeleted, false), gte(expenses.occurredAt, since))).all();
  const expenseTotal = expenseRows.reduce((sum, expense) => sum + expense.amount, 0);
  return { grossProfit, expenseTotal, netProfit: grossProfit - expenseTotal, revenue, billCount: periodBills.length, topProducts };
}

// The dashboard always uses local rows so unsynced sales are included. Its
// profit card is gross sales profit: sold-line revenue minus current product
// cost. Expenses remain separate and are subtracted only in Sales Reports.
export function computeLocalDashboardStats(shopId) {
  const since = startOfTodayIso();

  const todaysBills = db
    .select()
    .from(bills)
    .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false), gte(bills.createdAt, since)))
    .all();

  const salesToday = todaysBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  let profitToday = 0;
  for (const row of loadBillItems(todaysBills)) {
    const cost = lineCost(row.item, row);
    if (cost == null) continue;
    profitToday += (row.item.total || 0) - cost;
  }
  profitToday -= todaysBills.reduce((sum, bill) => sum + (bill.discount || 0), 0);

  const allProducts = db.select().from(products).where(and(eq(products.shopId, shopId), eq(products.isDeleted, false))).all();
  const totalInventoryValue = allProducts.reduce((sum, p) => {
    switch (p.stockType) {
      case 'PACK':
        return sum + p.stockPacks * (p.packSalePrice ?? p.salePrice * (p.packSize || 1)) + p.stockLooseUnits * p.salePrice;
      case 'AREA':
        return sum + p.stockAreaCm2 * p.salePrice;
      case 'LENGTH':
        return sum + p.stockLengthCm * p.salePrice;
      default:
        return sum + p.stockQuantity * p.salePrice;
    }
  }, 0);

  const revenueAnalytics = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const start = daysAgoIso(i);
    const end = i === 0 ? new Date().toISOString() : daysAgoIso(i - 1);
    const dayBills = db
      .select({ total: sql`coalesce(sum(${bills.totalAmount}), 0)` })
      .from(bills)
      .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false), gte(bills.createdAt, start), sql`${bills.createdAt} < ${end}`))
      .get();
    const label = dayLabels[new Date(start).getDay()];
    revenueAnalytics.push({ label, value: dayBills?.total || 0 });
  }

  const lowStockAlerts = allProducts
    .filter(isLowStock)
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stockType === 'AREA' ? p.stockAreaCm2 : p.stockType === 'LENGTH' ? p.stockLengthCm : p.stockType === 'PACK' ? (p.stockPacks || 0) + (p.stockLooseUnits || 0) : p.stockQuantity }));

  const recentInvoices = db
    .select()
    .from(bills)
    .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false)))
    .orderBy(sql`${bills.createdAt} desc`)
    .limit(5)
    .all()
    .map((b) => ({ id: b.id, serverId: b.serverId, customer: b.customerName, amount: b.totalAmount, date: b.createdAt, status: b.status }));

  return {
    summary: {
      totalSales: salesToday,
      totalRevenue: salesToday,
      profitToday,
      orderCount: todaysBills.length,
      totalInventoryValue,
    },
    revenueAnalytics,
    lowStockAlerts,
    recentInvoices,
    isLocalEstimate: true,
  };
}
