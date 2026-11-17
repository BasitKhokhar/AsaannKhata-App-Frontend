import React from 'react';
import { View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PackageX, CloudAlert, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { useTheme } from '../../theme';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function NotificationSettings() {
  const { colors, radii, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const lowStockAlerts = useNotificationPrefsStore((state) => state.lowStockAlerts);
  const setLowStockAlerts = useNotificationPrefsStore((state) => state.setLowStockAlerts);
  const syncStatusAlerts = useNotificationPrefsStore((state) => state.syncStatusAlerts);
  const setSyncStatusAlerts = useNotificationPrefsStore((state) => state.setSyncStatusAlerts);
  const khataDueReminders = useNotificationPrefsStore((state) => state.khataDueReminders);
  const setKhataDueReminders = useNotificationPrefsStore((state) => state.setKhataDueReminders);
  const rows = [
    { key: 'lowStock', icon: PackageX, title: t('notifications.lowStockAlerts'), subtitle: t('notifications.lowStockAlertsDesc'), value: lowStockAlerts, onValueChange: setLowStockAlerts },
    { key: 'syncStatus', icon: CloudAlert, title: t('notifications.syncStatusAlerts'), subtitle: t('notifications.syncStatusAlertsDesc'), value: syncStatusAlerts, onValueChange: setSyncStatusAlerts },
    { key: 'khataDue', icon: Wallet, title: t('notifications.khataDueReminders'), subtitle: t('notifications.khataDueRemindersDesc'), value: khataDueReminders, onValueChange: setKhataDueReminders },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('settings.notifications')} subtitle={t('notifications.subtitle')} />
        <View style={{ padding: spacing.lg, paddingTop: spacing.xs }}>
          <Card bordered={false} style={{ padding: spacing.xs }}>
            {rows.map((row) => (
              <ListRow
                key={row.key}
                style={{ flexDirection: rowDirection }}
                leading={<View style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.brand.primary + '1A', alignItems: 'center', justifyContent: 'center' }}><row.icon size={18} color={colors.brand.primary} strokeWidth={1.8} /></View>}
                title={row.title}
                subtitle={row.subtitle}
                titleStyle={{ textAlign }}
                subtitleStyle={{ textAlign }}
                trailing={<Switch value={row.value} onValueChange={row.onValueChange} trackColor={{ false: colors.surface.border, true: colors.brand.primary }} thumbColor={colors.surface.raised} />}
              />
            ))}
          </Card>
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
