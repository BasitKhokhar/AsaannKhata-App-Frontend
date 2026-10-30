import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Bell, Cloud, Coins, HelpCircle, Info, Trash2, LogOut, Check, Users, Store, CreditCard } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Chip } from '../../components/ui/Chip';
import { BottomNav } from '../../components/ui/BottomNav';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { themePresets } from '../../theme/colors';
import { useLanguageStore, useT, useIsUrdu } from '../../store/languageStore';
import { showConfirm } from '../../store/confirmStore';
import * as secureSession from '../../services/secureSession';
import { setAnalyticsUserId } from '../../services/analyticsService';
import { unregisterCurrentDevice } from '../../services/fcmService';
import { useShopStore } from '../../store/shopStore';
import { logoutRevenueCat } from '../../services/revenueCat';
import { useQueryClient } from '@tanstack/react-query';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { useShops } from '../../hooks/useShops';
import { suggestedPresetForShopType } from '../../theme/colors';

function rows(t) {
  return [
    { key: 'Profile', label: t('settings.profile'), description: t('settings.profileDesc'), icon: User },
    { key: 'StaffManagement', label: t('settings.staff.title'), description: t('settings.staff.subtitle'), icon: Users },
    { key: 'Notifications', label: t('settings.notifications'), description: t('settings.notificationsDesc'), icon: Bell },
    { key: 'SyncStatus', label: t('settings.syncStatus'), description: t('settings.syncStatusDesc'), icon: Cloud },
    { key: 'EarnCoins', label: t('settings.earnCoins'), description: t('settings.earnCoinsDesc'), icon: Coins },
    { key: 'HelpSupport', label: t('settings.helpSupport'), description: t('settings.helpSupportDesc'), icon: HelpCircle },
    { key: 'About', label: t('settings.about'), description: t('settings.aboutDesc'), icon: Info },
  ];
}

const THEME_MODE_KEYS = [
  { key: 'system', labelKey: 'settings.themeSystem' },
  { key: 'light', labelKey: 'settings.themeLight' },
  { key: 'dark', labelKey: 'settings.themeDark' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function Settings() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors, radii, typography, spacing } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const adminId = useAuthStore((s) => s.adminId);
  const themeScope = adminId && activeShopId ? `${adminId}:${activeShopId}` : null;
  const clearSession = useAuthStore((s) => s.clearSession);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const setPreset = useThemeStore((s) => s.setPreset);
  const clearPreset = useThemeStore((s) => s.clearPreset);
  const globalPreset = useThemeStore((s) => s.preset);
  const shopPresets = useThemeStore((s) => s.shopPresets);
  const { data: shops = [] } = useShops();
  const activeShop = shops.find((shop) => String(shop.id) === String(activeShopId));
  const selectedPreset = (themeScope && shopPresets?.[themeScope]) || (activeShop ? suggestedPresetForShopType(activeShop.shopTypeCode) : globalPreset) || 'emerald';
  const t = useT();
  const isUrdu = useIsUrdu();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  async function handleLogout() {
    await unregisterCurrentDevice();
    useShopStore.getState().setActiveShopId(null);
    clearSession();
    await secureSession.clearSession();
    setAnalyticsUserId(null);
    entitlementRepository.clear();
    queryClient.clear();
    logoutRevenueCat().catch(() => { });
    // Local SQLite business data is deliberately left intact — the same
    // shop owner logging back in should see it instantly (offline-first).
  }

  async function handleDeleteLocalData() {
    const confirmed = await showConfirm({
      title: t('settings.deleteAccountConfirmTitle'),
      message: t('settings.deleteAccountConfirmMessage'),
      confirmLabel: t('settings.confirmSignOut'),
      cancelLabel: t('common.cancel'),
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
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Text
          style={[
            typography.h1,
            { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign: isUrdu ? 'right' : 'left' },
          ]}
        >
          {t('settings.title')}
        </Text>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <Card bordered={false} style={{ padding: spacing.xs }}>
            {rows(t).map((row) => (
              <ListRow
                key={row.key}
                onPress={() => navigation.navigate(row.key)}
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
                title={row.label}
                subtitle={row.description}
                titleStyle={{ textAlign: isUrdu ? 'right' : 'left' }}
                showChevron
              />
            ))}
          </Card>

          <View>
            <SectionHeader title={t('settings.business')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                onPress={() => navigation.navigate('ShopsStack', { screen: 'ShopsList' })}
                leading={<Store size={18} color={colors.brand.primary} />}
                title={t('nav.myShops')}
                subtitle={t('settings.profile.myShopsDesc')}
                showChevron
              />
              <ListRow
                onPress={() => navigation.navigate('SubscriptionPlans')}
                leading={<CreditCard size={18} color={colors.brand.primary} />}
                title={t('nav.subscription')}
                showChevron
              />
            </Card>
          </View>

          <View>
            <SectionHeader title={t('settings.theme')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ flexDirection: rowDirection, gap: spacing.xs, padding: spacing.xs }}>
              {THEME_MODE_KEYS.map((m) => (
                <Chip
                  key={m.key}
                  label={t(m.labelKey)}
                  selected={mode === m.key}
                  onPress={() => setMode(m.key)}
                  style={{ flex: 1, alignItems: 'center' }}
                />
              ))}
            </Card>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: isUrdu ? 'right' : 'left' }]}>
              {t('settings.themePaletteDescription')}
            </Text>
            <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: spacing.sm }}>
              {Object.entries(themePresets).map(([key, option]) => {
                const selected = selectedPreset === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setPreset(key, themeScope)}
                    style={{
                      width: '31%', minWidth: 94, alignItems: 'center', gap: spacing.xs,
                      paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.brand.primary : colors.surface.border,
                      backgroundColor: colors.surface.raised,
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: option.primary, alignItems: 'center', justifyContent: 'center' }}>
                      {selected ? <Check size={18} color={colors.ink.onBrand} strokeWidth={2.5} /> : null}
                    </View>
                    <Text style={[typography.label, { color: colors.ink.primary }]}>{t(`settings.themePreset.${key}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {themeScope && shopPresets?.[themeScope] ? (
              <Pressable accessibilityRole="button" onPress={() => clearPreset(themeScope)} style={{ alignSelf: isUrdu ? 'flex-end' : 'flex-start', paddingVertical: spacing.sm, marginTop: spacing.xs }}>
                <Text style={[typography.label, { color: colors.brand.primary }]}>{t('settings.themeUseBusinessDefault')}</Text>
              </Pressable>
            ) : null}
          </View>

          <View>
            <SectionHeader title={t('settings.language')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ flexDirection: rowDirection, gap: spacing.xs, padding: spacing.xs }}>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.code}
                  label={l.label}
                  selected={lang === l.code}
                  onPress={() => setLang(l.code)}
                  style={{ flex: 1, alignItems: 'center' }}
                />
              ))}
            </Card>
          </View>

          <Card bordered={false} style={{ padding: spacing.xs }}>
            <ListRow
              onPress={handleDeleteLocalData}
              style={{ flexDirection: rowDirection }}
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
              title={t('settings.deleteAccount')}
              titleStyle={{ color: colors.semantic.danger, textAlign: isUrdu ? 'right' : 'left' }}
            />
          </Card>

          <Pressable
            onPress={handleLogout}
            style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.md }}
          >
            <LogOut size={16} color={colors.ink.secondary} strokeWidth={1.8} />
            <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('settings.logout')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="settings" />
    </AnimatedScreen>
  );
}
