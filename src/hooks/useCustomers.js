import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerRepository } from '../db/repositories/customerRepository';
import { customerPaymentRepository } from '../db/repositories/customerPaymentRepository';
import { useShopStore } from '../store/shopStore';

export function useCustomers() {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['customers', activeShopId],
    queryFn: () => customerRepository.listByShop(activeShopId),
    enabled: !!activeShopId,
  });
}

export function useCustomer(customerId) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['customer', activeShopId, customerId],
    queryFn: () => {
      const customer = customerRepository.getById(customerId);
      return customer?.shopId === activeShopId ? customer : null;
    },
    enabled: !!customerId && !!activeShopId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  return {
    mutate: ({ name, phone }, options) => {
      try {
        const customer = customerRepository.create({ shopId: activeShopId, name, phone: phone || null, balance: 0 });
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        options?.onSuccess?.(customer);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}

// Standalone khata payment — not tied to a specific bill (see Backend
// services/customerService.js::recordPayment and the sync-engine note in
// billRepository about why bill-level payments are modeled this way too).
export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  return {
    mutate: ({ customerId, amount, note }, options) => {
      try {
        const amt = parseFloat(amount) || 0;
        const customer = customerRepository.getById(customerId);
        if (!customer || customer.shopId !== activeShopId) throw new Error('Customer is not in the selected shop');
        const payment = customerPaymentRepository.create({ shopId: activeShopId, customerId, amount: amt, note: note || null });
        customerRepository.adjustBalance(customerId, -amt);
        queryClient.invalidateQueries({ queryKey: ['customers', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['customer', activeShopId, customerId] });
        options?.onSuccess?.(payment);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}
