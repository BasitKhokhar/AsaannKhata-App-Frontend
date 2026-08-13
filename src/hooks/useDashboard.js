import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import { computeLocalDashboardStats } from '../db/repositories/analyticsRepository';
import { useShopStore } from '../store/shopStore';

export function useDashboardStats() {
  const activeShopId = useShopStore((s) => s.activeShopId);

  return useQuery({
    queryKey: ['dashboardStats', activeShopId],
    queryFn: async () => {
      const local = computeLocalDashboardStats(activeShopId);
      try {
        const remote = await dashboardApi.stats({ shopId: activeShopId });
        // Backend doesn't compute profit — always use the local estimate for it.
        return { ...remote, summary: { ...remote.summary, profitToday: local.summary.profitToday } };
      } catch (err) {
        return local;
      }
    },
    enabled: !!activeShopId,
  });
}

// Cloud-only breakdowns — no local SQLite equivalent exists for these today
// (product/category revenue breakdown isn't computed on-device), so unlike
// useDashboardStats there's no local fallback: a failure just surfaces as
// isError/empty state in the UI rather than an approximated local number.

export function useSalesTrend({ period = 'week' } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);

  return useQuery({
    queryKey: ['salesTrend', activeShopId, period],
    queryFn: () => dashboardApi.salesTrend({ period, shopId: activeShopId }),
    enabled: !!activeShopId,
  });
}

export function useSalesByProduct({ startDate, endDate, limit } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);

  return useQuery({
    queryKey: ['salesByProduct', activeShopId, startDate, endDate, limit],
    queryFn: () => dashboardApi.byProduct({ startDate, endDate, limit, shopId: activeShopId }),
    enabled: !!activeShopId,
  });
}

export function useSalesByCategory({ startDate, endDate } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);

  return useQuery({
    queryKey: ['salesByCategory', activeShopId, startDate, endDate],
    queryFn: () => dashboardApi.byCategory({ startDate, endDate, shopId: activeShopId }),
    enabled: !!activeShopId,
  });
}

export function useProfitMarginTrend({ period = 'week' } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);

  return useQuery({
    queryKey: ['profitMarginTrend', activeShopId, period],
    queryFn: () => dashboardApi.profitMarginTrend({ period, shopId: activeShopId }),
    enabled: !!activeShopId,
  });
}
