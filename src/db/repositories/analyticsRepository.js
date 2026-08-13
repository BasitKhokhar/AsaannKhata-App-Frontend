import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../client';
import { bills, billItems, products } from '../schema';

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
  let netProfit = 0;

  for (const bill of periodBills) {
    const items = db.select().from(billItems).where(eq(billItems.billId, bill.id)).all();
    for (const item of items) {
      productTotals.set(item.productName, (productTotals.get(item.productName) || 0) + item.total);

      const product = db.select().from(products).where(eq(products.id, item.productId)).get();
      if (product) {
        const qty = item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? 0;
        const costBasis = product.stockType === 'PACK' ? product.packPurchasePrice ?? product.purchasePrice : product.purchasePrice;
        netProfit += (item.pricePerUnit - (costBasis || 0)) * qty;
      }
    }
  }

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  return { netProfit, revenue, billCount: periodBills.length, topProducts };
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
      const qty = item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? 0;
      const costBasis = product.stockType === 'PACK' ? product.packPurchasePrice ?? product.purchasePrice : product.purchasePrice;
      profitToday += (item.pricePerUnit - (costBasis || 0)) * qty;
    }
  }

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
    .filter((p) => p.lowStockThreshold != null && p.stockQuantity < p.lowStockThreshold)
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stockQuantity }));

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
