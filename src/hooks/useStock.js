import { useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { stockRepository } from '../db/repositories/stockRepository';
import { productRepository } from '../db/repositories/productRepository';
import { useShopStore } from '../store/shopStore';

// Stock history is paged from SQLite. Sync imports other devices' changes
// into the same shop-scoped ledger, so this screen works offline too.
export function useStockTransactions(type = 'all') {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: products = [] } = useShopProducts(activeShopId);

  const query = useInfiniteQuery({
    queryKey: ['stockTransactions', activeShopId, type],
    queryFn: ({ pageParam }) => stockRepository.listPageByShop(activeShopId, { type, cursor: pageParam, limit: 100 }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.length === 100
      ? { createdAt: lastPage.at(-1).createdAt, id: lastPage.at(-1).id }
      : undefined,
    enabled: !!activeShopId,
  });

  const productsById = useMemo(() => {
    const map = new Map();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const transactions = useMemo(
    () => (query.data?.pages.flat() || []).map((transaction) => ({
      ...transaction,
      productName: productsById.get(transaction.productId)?.name || 'Unknown product',
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

export function useStockOverview() {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: products = [] } = useShopProducts(activeShopId);

  const lowStock = useMemo(
    () => (activeShopId ? productRepository.listLowStock(activeShopId) : []),
    [activeShopId, products]
  );

  return { totalSkus: products.length, lowStockCount: lowStock.length, lowStock };
}
