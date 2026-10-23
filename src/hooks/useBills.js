import { useQuery, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { billRepository } from '../db/repositories/billRepository';
import { coinUsageLogRepository } from '../db/repositories/coinUsageLogRepository';
import { useShopStore } from '../store/shopStore';
import { useCoinsStore } from '../store/coinsStore';
import { useEntitlement } from './useEntitlement';

// A bill created OFFLINE on the free tier draws down the local coin balance
// — reconciled with the server's authoritative balance by
// pushPendingCoinUsage() once connectivity returns (src/sync/push.js). The
// cost itself is server-defined (GET /ads/config's billCoinCost, cached in
// coinsStore) — the amount logged here is only a local optimistic estimate;
// the backend ignores any client-supplied amount and always charges its own
// BILL_COIN_COST, so a stale cached value here can never under/over-charge.
// Fire-and-forget: runs after the bill is already committed to SQLite, so it
// can never delay or fail the bill-creation flow itself.
async function recordCoinUsageIfNeeded(entitlement) {
  if (entitlement?.cloudEnabled) return; // paid/cloud plans never spend coins
  try {
    const netState = await NetInfo.fetch();
    const isOffline = !(netState.isConnected && netState.isInternetReachable !== false);
    if (!isOffline) return;
    const cost = useCoinsStore.getState().billCoinCost || 1;
    coinUsageLogRepository.create({ actionType: 'BILL', amount: cost });
    useCoinsStore.getState().spendCoinsOptimistic(cost);
  } catch (err) {
    // Best-effort bookkeeping only — never surfaces to the caller.
  }
}

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
  const { data: entitlement } = useEntitlement();

  return {
    mutate: (payload, options) => {
      try {
        const bill = billRepository.createBillWithItems({ ...payload, shopId: activeShopId });
        queryClient.invalidateQueries({ queryKey: ['bills', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customer'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['salesReport', activeShopId] });
        recordCoinUsageIfNeeded(entitlement);
        options?.onSuccess?.(bill);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}
