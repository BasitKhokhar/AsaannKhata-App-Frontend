import { eq, and, gte, sql } from 'drizzle-orm';
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

  for (const bill of periodBills) {
    const items = db.select().from(billItems).where(eq(billItems.billId, bill.id)).all();
    for (const item of items) {
      productTotals.set(item.productName, (productTotals.get(item.productName) || 0) + item.total);

      const product = db.select().from(products).where(eq(products.id, item.productId)).get();
      if (product) {
        const qty = item.stockType === 'PACK'
          ? (item.packQuantity || 0) * (product.packSize || 1) + (item.looseQuantity || 0)
          : item.quantity ?? item.totalArea ?? item.lengthCm ?? 0;
        grossProfit += (item.total || 0) - (product.purchasePrice || 0) * qty;
      }
    }
  }

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  const expenseRows = db.select().from(expenses).where(and(eq(expenses.shopId, shopId), eq(expenses.isDeleted, false), gte(expenses.occurredAt, since))).all();
  const expenseTotal = expenseRows.reduce((sum, expense) => sum + expense.amount, 0);
  return { grossProfit, expenseTotal, netProfit: grossProfit - expenseTotal, revenue, billCount: periodBills.length, topProducts };
}

// Best-effort offline fallback for the Dashboard when GET /dashboard/stats
// can't be reached. "Profit" isn't returned by that endpoint at all, so it's
// always computed locally, from purchase/sale price on each sold line —
// approximate for AREA/LENGTH modes (salePrice/purchasePrice are treated as
// per-base-unit for this estimate) since true per-unit cost conversion
// mirrors backend logic (utils/unitConverter.js) not ported client-side.
export function computeLocalDashboardStats(shopId) {
  const since = startOfTodayIso();

  const todaysBills = db
    .select()
    .from(bills)
    .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false), gte(bills.createdAt, since)))
    .all();

  const salesToday = todaysBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  let profitToday = 0;
  for (const bill of todaysBills) {
    const items = db.select().from(billItems).where(eq(billItems.billId, bill.id)).all();
    for (const item of items) {
      const product = db.select().from(products).where(eq(products.id, item.productId)).get();
      if (!product) continue;
      const qty = item.stockType === 'PACK'
        ? (item.packQuantity || 0) * (product.packSize || 1) + (item.looseQuantity || 0)
        : item.quantity ?? item.totalArea ?? item.lengthCm ?? 0;
      profitToday += (item.total || 0) - (product.purchasePrice || 0) * qty;
    }
  }
  const todayExpenses = db.select().from(expenses).where(and(eq(expenses.shopId, shopId), eq(expenses.isDeleted, false), gte(expenses.occurredAt, since))).all();
  profitToday -= todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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
    .map((b) => ({ id: b.id, customer: b.customerName, amount: b.totalAmount, date: b.createdAt, status: b.status }));

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
