import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/notificationsApi';
import { useShopStore } from '../store/shopStore';

// Server-only — no local cache table for push notifications (unlike shops/
// products/etc., there's nothing useful to show offline here), so this is a
// React Query requests rather than the repository+sync pattern used elsewhere
// in this app. List and unread keys include the active shop so switching shops
// cannot briefly display another shop's inbox.
export function useNotifications() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  return useInfiniteQuery({
    queryKey: ['notifications', 'list', activeShopId],
    queryFn: ({ pageParam }) => notificationsApi.list({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.hasMore ? (lastPage.page || 1) + 1 : undefined,
    enabled: !!activeShopId,
  });
}

export function useUnreadNotificationCount() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  return useQuery({
    queryKey: ['notifications', 'unreadCount', activeShopId],
    queryFn: notificationsApi.unreadCount,
    enabled: !!activeShopId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
