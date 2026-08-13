import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import * as secureSession from '../../services/secureSession';

const ROWS = [
  { key: 'Profile', label: 'Profile' },
  { key: 'Notifications', label: 'Notifications' },
  { key: 'SyncStatus', label: 'Sync Status' },
  { key: 'HelpSupport', label: 'Help & Support' },
  { key: 'About', label: 'About, Terms & Privacy' },
];

const THEME_MODES = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function Settings() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  async function handleLogout() {
    clearSession();
    await secureSession.clearSession();
    // Local SQLite business data is deliberately left intact — the same
    // shop owner logging back in should see it instantly (offline-first).
  }

  async function handleDeleteLocalData() {
    // No server-side account-deletion endpoint exists yet — this clears the
    // session and signs out. Full server-side deletion is a follow-up item.
    setDeleteConfirmOpen(false);
    await handleLogout();
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Settings</Text>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {ROWS.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => navigation.navigate(row.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.surface.border,
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface.border }} />
              <Text style={[typography.body, { color: colors.ink.primary, flex: 1 }]}>{row.label}</Text>
              <Svg width={14} height={14} viewBox="0 0 16 16">
                <Path d="M6 3l5 5-5 5" stroke={colors.ink.secondary} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ))}

          <View style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
            <Text style={[typography.body, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Theme</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {THEME_MODES.map((m) => {
                const active = mode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: spacing.xs,
                      borderRadius: 10,
                      backgroundColor: active ? colors.brand.primary : 'transparent',
                      borderWidth: active ? 0 : 1,
                      borderColor: colors.surface.border,
                    }}
                  >
                    <Text style={[typography.caption, { color: active ? '#FAF9F6' : colors.ink.secondary }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => setDeleteConfirmOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.surface.border,
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.semantic.dangerBg }} />
            <Text style={[typography.bodyMedium, { color: colors.semantic.danger, flex: 1 }]}>Delete Account & Data</Text>
            <Svg width={14} height={14} viewBox="0 0 16 16">
              <Path d="M6 3l5 5-5 5" stroke={colors.semantic.danger} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>

          <Pressable onPress={handleLogout} style={{ paddingVertical: spacing.md }}>
            <Text style={[typography.body, { color: colors.ink.secondary }]}>Log Out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={deleteConfirmOpen} transparent animationType="fade" onRequestClose={() => setDeleteConfirmOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.surface.bg, borderRadius: 20, padding: spacing.lg, gap: spacing.md }}>
            <Text style={[typography.h3, { color: colors.ink.primary }]}>Delete Account & Data</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>
              This removes your session from this device and signs you out. Full server-side account deletion isn't available yet — contact support if you need your account permanently erased.
            </Text>
            <Button title="Sign Out & Clear Session" variant="danger" onPress={handleDeleteLocalData} />
            <Button title="Cancel" variant="ghost" onPress={() => setDeleteConfirmOpen(false)} />
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}
