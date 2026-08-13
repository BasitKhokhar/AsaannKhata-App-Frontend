import { useQuery } from '@tanstack/react-query';
import { computeSalesReport } from '../db/repositories/analyticsRepository';
import { useShopStore } from '../store/shopStore';

export function useSalesReport(period, { enabled = true } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['salesReport', activeShopId, period],
    queryFn: () => computeSalesReport(activeShopId, period),
    enabled: !!activeShopId && enabled,
  });
}
