import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billRepository } from '../db/repositories/billRepository';
import { useShopStore } from '../store/shopStore';

export function useBills({ status } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['bills', activeShopId, status],
    queryFn: () => billRepository.listByShop(activeShopId, { status }),
    enabled: !!activeShopId,
  });
}

export function useBill(billId) {
  return useQuery({
    queryKey: ['bill', billId],
    queryFn: () => billRepository.getWithItems(billId),
    enabled: !!billId,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);

  return {
    mutate: (payload, options) => {
      try {
        const bill = billRepository.createBillWithItems({ ...payload, shopId: activeShopId });
        queryClient.invalidateQueries({ queryKey: ['bills', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeShopId] });
        options?.onSuccess?.(bill);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}
