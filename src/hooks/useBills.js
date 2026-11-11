import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billRepository } from '../db/repositories/billRepository';
import { listSettledBills, recordBillPayment, settledBill } from '../db/repositories/billSettlementRepository';
import { coinUsageLogRepository } from '../db/repositories/coinUsageLogRepository';
import { useShopStore } from '../store/shopStore';
import { useCoinsStore } from '../store/coinsStore';
import { useEntitlement } from './useEntitlement';
import { isAdSupportedEntitlement } from '../utils/entitlements';

// Free accounts receive a server-configured daily bill allowance. Additional
// bills require rewarded-ad coins and append an account-level usage row for
// authoritative backend reconciliation. Paid plans never enter this path.
function coinCostForNextBill(entitlement) {
  if (!isAdSupportedEntitlement(entitlement)) return null;
  const { adCoins, billsUsedToday, freeDailyRecordLimit, billCoinCost } = useCoinsStore.getState();
  const cost = billCoinCost || 1;
  if (freeDailyRecordLimit <= 0 || billsUsedToday < freeDailyRecordLimit) return 0;
  if (adCoins < cost) throw new Error('billing.coinsRequired');
  return cost;
}

function recordCoinUsageIfNeeded(entitlement, coinCost) {
  if (!isAdSupportedEntitlement(entitlement)) return;
  try {
    if (coinCost > 0) {
      coinUsageLogRepository.create({ actionType: 'BILL', amount: coinCost });
      useCoinsStore.getState().spendCoinsOptimistic(coinCost);
    } else {
      useCoinsStore.getState().recordFreeBillOptimistic();
    }
  } catch (err) {
    // Best-effort bookkeeping only — never surfaces to the caller.
  }
}

export function useBills({ status } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['bills', activeShopId, status],
    queryFn: () => {
      const rows = listSettledBills(activeShopId);
      return status && status !== 'all' ? rows.filter((bill) => bill.status === status.toUpperCase()) : rows;
    },
    enabled: !!activeShopId,
  });
}

export function useBill(billId) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['bill', activeShopId, billId],
    queryFn: () => {
      const bill = billRepository.getWithItems(billId);
      return bill?.shopId === activeShopId ? settledBill(bill) : null;
    },
    enabled: !!billId && !!activeShopId,
  });
}

export function useRecordBillPayment() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  return {
    mutate: ({ billId, amount }, options) => {
      try {
        const payment = recordBillPayment({ billId, shopId: activeShopId, amount });
        queryClient.invalidateQueries({ queryKey: ['bills', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['bill', activeShopId, billId] });
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customer', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeShopId] });
        options?.onSuccess?.(payment);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: entitlement } = useEntitlement();

  return {
    mutate: (payload, options) => {
      try {
        const coinCost = coinCostForNextBill(entitlement);
        const bill = billRepository.createBillWithItems({ ...payload, shopId: activeShopId });
        queryClient.invalidateQueries({ queryKey: ['bills', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customer'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['salesReport', activeShopId] });
        recordCoinUsageIfNeeded(entitlement, coinCost);
        options?.onSuccess?.(bill);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}
