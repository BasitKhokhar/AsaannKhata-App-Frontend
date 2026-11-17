import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonListRow } from '../../components/ui/Skeleton';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/dates';

// Server-backed inbox. Notification preferences intentionally live on their
// own Settings screen so the Home bell only shows notifications received
// from the backend Notification table.
export default function NotificationInbox() {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { data: unreadCountData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.pages?.flatMap((page) => page?.notifications || page?.data || []) || [];
  const unreadCount = unreadCountData?.unreadCount ?? unreadCountData?.count ?? 0;

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header
          title={t('notifications.inboxTitle')}
          subtitle={unreadCount > 0 ? t('notifications.unreadCount').replace('{count}', String(unreadCount)) : t('notifications.inboxSubtitle')}
          right={unreadCount > 0 ? (
            <Pressable onPress={() => markAllRead.mutate()} disabled={markAllRead.isPending} hitSlop={8} style={{ alignItems: 'center', gap: 2 }}>
              <CheckCheck size={20} color={colors.brand.primary} strokeWidth={1.8} />
              <Text style={[typography.caption, { color: colors.brand.primary, fontSize: 10 }]}>{t('notifications.markAllRead')}</Text>
            </Pressable>
          ) : null}
        />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={() => refetch()} tintColor={colors.brand.primary} />}
        >
          {isLoading ? (
            <Card bordered={false} style={{ padding: spacing.md }}>
              {[0, 1, 2, 3].map((key) => <SkeletonListRow key={key} />)}
            </Card>
          ) : isError ? (
            <EmptyState icon={<Bell size={40} color={colors.brand.primary} />} title={t('notifications.couldntLoad')} actionLabel={t('common.retry')} onAction={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState icon={<Bell size={40} color={colors.brand.primary} />} title={t('notifications.empty')} description={t('notifications.inboxSubtitle')} />
          ) : (
            <>
              {items.map((item) => {
                const isRead = item.isRead ?? item.read ?? false;
                const message = item.message || item.body || '';
                return (
                  <Pressable key={item.id} onPress={() => { if (!isRead) markRead.mutate(item.id); }}>
                    <Card
                      level="xs"
                      style={{
                        flexDirection: rowDirection,
                        alignItems: 'flex-start',
                        gap: spacing.md,
                        borderColor: isRead ? colors.surface.border : colors.brand.primary + '66',
                        backgroundColor: isRead ? colors.surface.card : colors.brand.primary + '0D',
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.brand.primary + '1A', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={19} color={colors.brand.primary} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
                          <Text style={[typography.bodyMedium, { flex: 1, color: colors.ink.primary, textAlign, fontWeight: isRead ? '500' : '700' }]}>{item.title || message}</Text>
                          {!isRead ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand.primary }} /> : null}
                        </View>
                        {message && message !== item.title ? <Text style={[typography.body, { color: colors.ink.secondary, textAlign }]}>{message}</Text> : null}
                        {item.createdAt ? <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{formatRelativeTime(item.createdAt)}</Text> : null}
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
              {hasNextPage ? <Button title={t('notifications.loadMore')} variant="outline" onPress={() => fetchNextPage()} loading={isFetchingNextPage} /> : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
