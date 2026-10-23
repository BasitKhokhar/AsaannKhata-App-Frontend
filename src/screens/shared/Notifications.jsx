import React from 'react';
import { View, Text, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PackageX, CloudAlert, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';
import { useT, useIsUrdu } from '../../store/languageStore';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/dates';

// Two sections on one screen: the real push-notification inbox (server-
// backed, see src/services/notificationsApi.js + src/services/fcmService.js)
// above the pre-existing in-app-alert-preference toggles below — those never
// trigger a system notification, they just gate other screens' own inline
// banners (e.g. Dashboard's low-stock section) and are kept as-is.
export default function Notifications() {
  const { colors, radii, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const lowStockAlerts = useNotificationPrefsStore((s) => s.lowStockAlerts);
  const setLowStockAlerts = useNotificationPrefsStore((s) => s.setLowStockAlerts);
  const syncStatusAlerts = useNotificationPrefsStore((s) => s.syncStatusAlerts);
  const setSyncStatusAlerts = useNotificationPrefsStore((s) => s.setSyncStatusAlerts);
  const khataDueReminders = useNotificationPrefsStore((s) => s.khataDueReminders);
  const setKhataDueReminders = useNotificationPrefsStore((s) => s.setKhataDueReminders);

  const { data: notificationsPage, isError: notificationsError } = useNotifications(1);
  const { data: unreadCountData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notificationItems = Array.isArray(notificationsPage)
    ? notificationsPage
    : notificationsPage?.data || notificationsPage?.notifications || [];
  const unreadCount = unreadCountData?.count ?? unreadCountData?.unreadCount ?? 0;

  const switchTrackColor = { false: colors.surface.border, true: colors.brand.primary };

  const rows = [
    {
      key: 'lowStock',
      icon: PackageX,
      title: t('notifications.lowStockAlerts'),
      subtitle: t('notifications.lowStockAlertsDesc'),
      value: lowStockAlerts,
      onValueChange: setLowStockAlerts,
    },
    {
      key: 'syncStatus',
      icon: CloudAlert,
      title: t('notifications.syncStatusAlerts'),
      subtitle: t('notifications.syncStatusAlertsDesc'),
      value: syncStatusAlerts,
      onValueChange: setSyncStatusAlerts,
    },
    {
      key: 'khataDue',
      icon: Wallet,
      title: t('notifications.khataDueReminders'),
      subtitle: t('notifications.khataDueRemindersDesc'),
      value: khataDueReminders,
      onValueChange: setKhataDueReminders,
    },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('notifications.inboxTitle')} subtitle={t('notifications.inboxSubtitle')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <View>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <SectionHeader title={t('notifications.inboxTitle')} style={{ marginBottom: 0, flex: 1, flexDirection: rowDirection }} />
              {unreadCount > 0 ? (
                <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
                  <Text style={{ color: colors.brand.primary, fontWeight: '600', fontSize: 12 }}>{t('notifications.markAllRead')}</Text>
                </Pressable>
              ) : null}
            </View>
            <Card bordered={false} style={{ padding: spacing.xs }}>
              {notificationsError ? (
                <Text style={{ color: colors.ink.secondary, textAlign, padding: spacing.sm }}>{t('notifications.couldntLoad')}</Text>
              ) : notificationItems.length === 0 ? (
                <Text style={{ color: colors.ink.secondary, textAlign, padding: spacing.sm }}>{t('notifications.empty')}</Text>
              ) : (
                notificationItems.map((item) => {
                  const isRead = item.read ?? item.isRead ?? false;
                  return (
                    <ListRow
                      key={item.id}
                      onPress={() => {
                        if (!isRead) markRead.mutate(item.id);
                      }}
                      style={{ flexDirection: rowDirection }}
                      leading={
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            marginTop: 6,
                            backgroundColor: isRead ? 'transparent' : colors.brand.primary,
                          }}
                        />
                      }
                      title={item.title || item.message || item.body || ''}
                      subtitle={item.body && item.title ? item.body : item.createdAt ? formatRelativeTime(item.createdAt) : undefined}
                      titleStyle={{ textAlign, fontWeight: isRead ? '400' : '700' }}
                    />
                  );
                })
              )}
            </Card>
          </View>

          <View>
            <SectionHeader title={t('notifications.alertsSectionTitle')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              {rows.map((row) => (
                <ListRow
                  key={row.key}
                  style={{ flexDirection: rowDirection }}
                  leading={
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radii.md,
                        backgroundColor: colors.brand.primary + '1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <row.icon size={18} color={colors.brand.primary} strokeWidth={1.8} />
                    </View>
                  }
                  title={row.title}
                  subtitle={row.subtitle}
                  titleStyle={{ textAlign }}
                  trailing={
                    <Switch
                      value={row.value}
                      onValueChange={row.onValueChange}
                      trackColor={switchTrackColor}
                      thumbColor={colors.surface.raised}
                    />
                  }
                />
              ))}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
