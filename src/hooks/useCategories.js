import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryRepository } from '../db/repositories/categoryRepository';
import { useShopStore } from '../store/shopStore';

// Reads/writes go straight to local SQLite — this is the offline-first
// source of truth. The sync engine (src/sync/) reconciles these `pending`
// rows with the server in the background; the UI never waits on network.
export function useCategories() {
  const activeShopId = useShopStore((s) => s.activeShopId);
  return useQuery({
    queryKey: ['categories', activeShopId],
    queryFn: () => categoryRepository.listByShop(activeShopId),
    enabled: !!activeShopId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  return {
    mutate: ({ name, imageLocalUri }) => {
      const category = categoryRepository.create({ shopId: activeShopId, name, imageLocalUri: imageLocalUri || null });
      queryClient.invalidateQueries({ queryKey: ['categories', activeShopId] });
      return category;
    },
  };
}
