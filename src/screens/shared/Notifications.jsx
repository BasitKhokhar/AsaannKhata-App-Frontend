import React from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PackageX, CloudAlert, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';

// In-app-only preference center — no push infrastructure exists or is
// planned. These toggles are read by other screens (e.g. Dashboard's
// low-stock section) to decide whether to surface an in-app alert.
export default function Notifications() {
  const { colors, radii, spacing } = useTheme();
  const lowStockAlerts = useNotificationPrefsStore((s) => s.lowStockAlerts);
  const setLowStockAlerts = useNotificationPrefsStore((s) => s.setLowStockAlerts);
  const syncStatusAlerts = useNotificationPrefsStore((s) => s.syncStatusAlerts);
  const setSyncStatusAlerts = useNotificationPrefsStore((s) => s.setSyncStatusAlerts);
  const khataDueReminders = useNotificationPrefsStore((s) => s.khataDueReminders);
  const setKhataDueReminders = useNotificationPrefsStore((s) => s.setKhataDueReminders);

  const switchTrackColor = { false: colors.surface.border, true: colors.brand.primary };

  const rows = [
    {
      key: 'lowStock',
      icon: PackageX,
      title: 'Low Stock Alerts',
      subtitle: 'Notify when product quantity drops below threshold',
      value: lowStockAlerts,
      onValueChange: setLowStockAlerts,
    },
    {
      key: 'syncStatus',
      icon: CloudAlert,
      title: 'Sync Status Alerts',
      subtitle: 'Notify when a shop fails to sync or falls behind',
      value: syncStatusAlerts,
      onValueChange: setSyncStatusAlerts,
    },
    {
      key: 'khataDue',
      icon: Wallet,
      title: 'Khata Due Reminders',
      subtitle: 'Notify when a customer’s credit balance is due',
      value: khataDueReminders,
      onValueChange: setKhataDueReminders,
    },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Notifications" subtitle="In-app alert preferences" />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <View>
            <SectionHeader title="Alerts" />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              {rows.map((row) => (
                <ListRow
                  key={row.key}
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
