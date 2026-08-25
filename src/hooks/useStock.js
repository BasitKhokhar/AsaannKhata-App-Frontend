import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockRepository } from '../db/repositories/stockRepository';
import { productRepository } from '../db/repositories/productRepository';
import { stockApi } from '../services/stockApi';
import { useShopStore } from '../store/shopStore';

// Local-first, remote-merge — mirrors the hybrid pattern already established
// in useDashboard.js: read the local SQLite ledger immediately, then try the
// server's shop-wide transaction log (reflects adjustments made on other
// synced devices) and prefer it when reachable, falling back to local on
// failure — stock data is "as of last sync," not live (no realtime backend).
export function useStockTransactions() {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: products = [] } = useShopProducts(activeShopId);

  const query = useQuery({
    queryKey: ['stockTransactions', activeShopId],
    queryFn: async () => {
      const local = stockRepository.listByShop(activeShopId);
      try {
        const remote = await stockApi.list({ shopId: activeShopId });
        const rows = Array.isArray(remote) ? remote : remote?.data;
        return Array.isArray(rows) && rows.length ? rows : local;
      } catch (err) {
        return local;
      }
    },
    enabled: !!activeShopId,
  });

  const productsById = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const transactions = useMemo(
    () =>
      (query.data || []).map((t) => ({
        ...t,
        productName: productsById.get(t.productId)?.name || 'Unknown product',
      })),
    [query.data, productsById]
  );

  return { ...query, data: transactions };
}

function useShopProducts(shopId) {
  return useQuery({
    queryKey: ['products', shopId],
    queryFn: () => productRepository.listByShop(shopId),
    enabled: !!shopId,
  });
}

// Overview counters for the Stock screen's stat row — reuses the same
// low-stock computation Dashboard already relies on (productRepository.
// listLowStock) rather than a second implementation.
export function useStockOverview() {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: products = [] } = useShopProducts(activeShopId);

  const lowStock = useMemo(
    () => (activeShopId ? productRepository.listLowStock(activeShopId) : []),
    [activeShopId, products]
  );

  return { totalSkus: products.length, lowStockCount: lowStock.length, lowStock };
}
