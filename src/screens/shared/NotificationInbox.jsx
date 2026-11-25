import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck, X, ChevronRight, CalendarDays, Tag } from 'lucide-react-native';
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
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const items = data?.pages?.flatMap((page) => page?.notifications || page?.data || []) || [];
  const unreadCount = unreadCountData?.unreadCount ?? unreadCountData?.count ?? 0;

  const openNotification = (item) => {
    setSelectedNotification(item);
    if (!(item.isRead ?? item.read ?? false)) markRead.mutate(item.id);
  };

  const selectedMessage = selectedNotification?.message || selectedNotification?.body || '';
  const selectedTitle = selectedNotification?.title || selectedMessage || t('notifications.inboxTitle');
  const selectedDate = selectedNotification?.createdAt || selectedNotification?.sentAt || selectedNotification?.updatedAt;

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
                  <Pressable key={item.id} onPress={() => openNotification(item)} accessibilityRole="button">
                    <Card
                      bordered={false}
                      level="none"
                      style={{
                        flexDirection: rowDirection,
                        alignItems: 'flex-start',
                        gap: spacing.md,
                        backgroundColor: colors.surface.card,
                      }}
                    >
                      <View
                        accessible={false}
                        style={{
                          width: 3,
                          alignSelf: 'stretch',
                          minHeight: 40,
                          borderRadius: 2,
                          backgroundColor: isRead ? 'transparent' : colors.brand.primary,
                        }}
                      />
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
                      <ChevronRight size={18} color={colors.ink.secondary} style={{ marginTop: 10, transform: [{ scaleX: isUrdu ? -1 : 1 }] }} />
                    </Card>
                  </Pressable>
                );
              })}
              {hasNextPage ? <Button title={t('notifications.loadMore')} variant="outline" onPress={() => fetchNextPage()} loading={isFetchingNextPage} /> : null}
            </>
          )}
        </ScrollView>
        <Modal visible={!!selectedNotification} transparent animationType="fade" onRequestClose={() => setSelectedNotification(null)}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(10, 18, 30, 0.52)' }}>
            <View style={{ width: '100%', maxWidth: 520, maxHeight: '82%', backgroundColor: colors.surface.bg, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.lg, borderWidth: 1, borderColor: colors.surface.border }}>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.brand.primary + '1A', alignItems: 'center', justifyContent: 'center' }}><Bell size={23} color={colors.brand.primary} /></View>
                <View style={{ flex: 1 }}><Text style={[typography.h2, { color: colors.ink.primary, textAlign }]}>{t('notifications.detailTitle')}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('notifications.detailSubtitle')}</Text></View>
                <Pressable onPress={() => setSelectedNotification(null)} hitSlop={10}><X size={22} color={colors.ink.secondary} /></Pressable>
              </View>
              <Card bordered={false} style={{ gap: spacing.md, backgroundColor: colors.surface.raised }}>
                <Text style={[typography.h2, { color: colors.ink.primary, textAlign }]}>{selectedTitle}</Text>
                {selectedMessage && selectedMessage !== selectedTitle ? <Text style={[typography.body, { color: colors.ink.secondary, textAlign }]}>{selectedMessage}</Text> : null}
                <View style={{ height: 1, backgroundColor: colors.surface.border }} />
                {selectedNotification?.type ? <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}><Tag size={16} color={colors.brand.primary} /><Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{String(selectedNotification.type)}</Text></View> : null}
                {selectedDate ? <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}><CalendarDays size={16} color={colors.brand.primary} /><Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{new Date(selectedDate).toLocaleString()}</Text></View> : null}
              </Card>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
