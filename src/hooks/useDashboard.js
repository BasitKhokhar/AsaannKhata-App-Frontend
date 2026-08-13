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
