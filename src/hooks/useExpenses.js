import { useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseRepository } from '../db/repositories/expenseRepository';
import { useShopStore } from '../store/shopStore';

const invalidate = (queryClient, shopId) => {
  queryClient.invalidateQueries({ queryKey: ['expenses', shopId] });
  queryClient.invalidateQueries({ queryKey: ['salesReport', shopId] });
  queryClient.invalidateQueries({ queryKey: ['dashboardStats', shopId] });
};

export function useExpenses() {
  const shopId = useShopStore((state) => state.activeShopId);
  return useQuery({
    queryKey: ['expenses', shopId],
    queryFn: () => expenseRepository.listByShop(shopId),
    enabled: !!shopId,
  });
}

export function useExpenseActions() {
  const shopId = useShopStore((state) => state.activeShopId);
  const queryClient = useQueryClient();
  return {
    create(fields) {
      if (!shopId || !(Number(fields.amount) > 0)) throw new Error('Expense amount must be positive');
      const result = expenseRepository.create({ ...fields, shopId, amount: Number(fields.amount) });
      invalidate(queryClient, shopId);
      return result;
    },
    update(id, fields) {
      if (!(Number(fields.amount) > 0)) throw new Error('Expense amount must be positive');
      const result = expenseRepository.update(id, { ...fields, amount: Number(fields.amount) });
      invalidate(queryClient, shopId);
      return result;
    },
    remove(id) {
      expenseRepository.softDelete(id);
      invalidate(queryClient, shopId);
    },
  };
}
