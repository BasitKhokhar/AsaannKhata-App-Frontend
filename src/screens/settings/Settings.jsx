import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Bell, Cloud, HelpCircle, Info, Trash2, LogOut } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { showConfirm } from '../../store/confirmStore';
import * as secureSession from '../../services/secureSession';

const ROWS = [
  { key: 'Profile', label: 'Profile', description: 'Your account & shop details', icon: User },
  { key: 'Notifications', label: 'Notifications', description: 'In-app alert preferences', icon: Bell },
  { key: 'SyncStatus', label: 'Sync Status', description: 'Cloud sync & linked devices', icon: Cloud },
  { key: 'HelpSupport', label: 'Help & Support', description: 'FAQs and contact', icon: HelpCircle },
  { key: 'About', label: 'About, Terms & Privacy', description: 'Version & legal', icon: Info },
];

const THEME_MODES = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function Settings() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  async function handleLogout() {
    clearSession();
    await secureSession.clearSession();
    // Local SQLite business data is deliberately left intact — the same
    // shop owner logging back in should see it instantly (offline-first).
  }

  async function handleDeleteLocalData() {
    const confirmed = await showConfirm({
      title: 'Delete Account & Data',
      message:
        "This removes your session from this device and signs you out. Full server-side account deletion isn't available yet — contact support if you need your account permanently erased.",
      confirmLabel: 'Sign Out & Clear Session',
      cancelLabel: 'Cancel',
      isUrgent: true,
    });
    if (confirmed) {
      // No server-side account-deletion endpoint exists yet — this clears
      // the session and signs out. Full server-side deletion is a follow-up item.
      await handleLogout();
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Settings</Text>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <Card bordered={false} style={{ padding: spacing.xs }}>
            {ROWS.map((row) => (
              <ListRow
                key={row.key}
                onPress={() => navigation.navigate(row.key)}
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
                title={row.label}
                subtitle={row.description}
                showChevron
              />
            ))}
          </Card>

          <View>
            <SectionHeader title="Theme" />
            <Card bordered={false} style={{ flexDirection: 'row', gap: spacing.xs, padding: spacing.xs }}>
              {THEME_MODES.map((m) => (
                <Chip
                  key={m.key}
                  label={m.label}
                  selected={mode === m.key}
                  onPress={() => setMode(m.key)}
                  style={{ flex: 1, alignItems: 'center' }}
                />
              ))}
            </Card>
          </View>

          <Card bordered={false} style={{ padding: spacing.xs }}>
            <ListRow
              onPress={handleDeleteLocalData}
              leading={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.md,
                    backgroundColor: colors.semantic.dangerBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={18} color={colors.semantic.danger} strokeWidth={1.8} />
                </View>
              }
              title="Delete Account & Data"
              titleStyle={{ color: colors.semantic.danger }}
            />
          </Card>

          <Pressable
            onPress={handleLogout}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.md }}
          >
            <LogOut size={16} color={colors.ink.secondary} strokeWidth={1.8} />
            <Text style={[typography.body, { color: colors.ink.secondary }]}>Log Out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
