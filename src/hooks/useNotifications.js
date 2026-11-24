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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications', 'list'] }, (current) => {
        if (!current?.pages) return current;
        return {
          ...current,
          pages: current.pages.map((page) => {
            const key = Array.isArray(page.notifications) ? 'notifications' : 'data';
            return { ...page, [key]: (page[key] || []).map((item) => String(item.id) === String(id) ? { ...item, isRead: true, read: true } : item) };
          }),
        };
      });
      queryClient.setQueriesData({ queryKey: ['notifications', 'unreadCount'] }, (current) => {
        if (!current) return current;
        const count = current.unreadCount ?? current.count;
        if (typeof count !== 'number' || count <= 0) return current;
        return current.unreadCount != null ? { ...current, unreadCount: count - 1 } : { ...current, count: count - 1 };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData({ queryKey: ['notifications', 'list'] }, (current) => {
        if (!current?.pages) return current;
        return { ...current, pages: current.pages.map((page) => {
          const key = Array.isArray(page.notifications) ? 'notifications' : 'data';
          return { ...page, [key]: (page[key] || []).map((item) => ({ ...item, isRead: true, read: true })) };
        }) };
      });
      queryClient.setQueriesData({ queryKey: ['notifications', 'unreadCount'] }, (current) => current ? { ...current, unreadCount: 0, count: 0 } : current);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
