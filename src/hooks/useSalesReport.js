import { useQuery } from '@tanstack/react-query';
import { computeSalesReport } from '../db/repositories/analyticsRepository';
import { useShopStore } from '../store/shopStore';

export function useSalesReport(range, { enabled = true } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const startDate = range?.startDate ? new Date(range.startDate).toISOString() : null;
  const endDate = range?.endDate ? new Date(range.endDate).toISOString() : null;
  return useQuery({
    queryKey: ['salesReport', activeShopId, startDate, endDate],
    queryFn: () => computeSalesReport(activeShopId, range),
    enabled: !!activeShopId && enabled,
  });
}
