import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../services/shopsApi';
import { shopRepository } from '../db/repositories/shopRepository';
import { useShopStore } from '../store/shopStore';
import { useAuthStore } from '../store/authStore';

// Shops are online-only to create/edit (see shopRepository comment), but
// reads fall back to the local cache so "My Shops" still renders offline.
export function useShops() {
  const adminId = useAuthStore((s) => s.adminId);
  return useQuery({
    queryKey: ['shops', adminId],
    queryFn: async () => {
      try {
        const remote = await shopsApi.list();
        shopRepository.upsertMany(remote);
      } catch (err) {
        // offline — fall through to whatever's cached locally
      }
      return shopRepository.listAll(adminId);
    },
    enabled: !!adminId,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  const adminId = useAuthStore((s) => s.adminId);
  return useMutation({
    mutationFn: shopsApi.create,
    onSuccess: (data) => {
      if (data.shop) {
        shopRepository.upsertMany([data.shop]);
        useShopStore.getState().setActiveShopId(String(data.shop.id));
      }
      queryClient.invalidateQueries({ queryKey: ['shops', adminId] });
    },
  });
}
