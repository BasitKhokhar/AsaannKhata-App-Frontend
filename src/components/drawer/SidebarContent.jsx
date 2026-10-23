import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Warehouse,
  Users,
  BarChart3,
  Wallet,
  Store,
  Bell,
  CreditCard,
  Settings as SettingsIcon,
  ChevronDown,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import { onBrandAlpha } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useShopStore } from '../../store/shopStore';
import { useShops } from '../../hooks/useShops';
import { useT, useIsUrdu } from '../../store/languageStore';

const NAV_ITEMS = [
  { route: 'HomeStack', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { route: 'BillingStack', screen: 'NewBill', labelKey: 'nav.billing', icon: Receipt },
  { route: 'CatalogStack', labelKey: 'nav.products', icon: Package },
  { route: 'StockStack', labelKey: 'nav.stock', icon: Warehouse },
  { route: 'BillingStack', screen: 'CreditCustomers', labelKey: 'nav.creditCustomers', icon: Users },
  { route: 'SalesReport', labelKey: 'nav.reports', icon: BarChart3 },
  { route: 'Expenses', labelKey: 'nav.expenses', icon: Wallet },
  { route: 'ShopsStack', labelKey: 'nav.myShops', icon: Store },
  { route: 'Notifications', labelKey: 'nav.notifications', icon: Bell },
  { route: 'SubscriptionPlans', labelKey: 'nav.subscription', icon: CreditCard },
  { route: 'SettingsStack', labelKey: 'nav.settings', icon: SettingsIcon },
];

export function SidebarContent({ navigation, state }) {
  const { colors, typography, radii, spacing } = useTheme();
  const name = useAuthStore((s) => s.name);
  const activeShopId = useShopStore((s) => s.activeShopId);
  const setActiveShopId = useShopStore((s) => s.setActiveShopId);
  const { data: shops = [] } = useShops();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  const activeRouteName = state.routes[state.index]?.name;
  const activeShop = shops.find((s) => String(s.id) === String(activeShopId));

  return (
    <LinearGradient colors={colors.gradient.header} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: spacing.md }}>
          <Pressable onPress={() => setSwitcherOpen(true)} style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 32, height: 32, borderRadius: radii.sm, overflow: 'hidden' }}>
              <LinearGradient colors={colors.gradient.accent} style={{ flex: 1 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.onBrand, textAlign: isUrdu ? 'right' : 'left' }]}>
                {activeShop?.name || t('nav.selectShop')}
              </Text>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 4 }}>
                <Text style={[typography.caption, { color: onBrandAlpha(0.55), fontSize: 9 }]}>
                  {activeShop?.shopTypeCode || ''} · {t('nav.switchShop')}
                </Text>
                <ChevronDown size={12} color={onBrandAlpha(0.55)} strokeWidth={1.8} />
              </View>
            </View>
          </Pressable>
        </View>

        <View style={{ padding: spacing.md }}>
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: spacing.sm,
              borderRadius: radii.md,
              padding: spacing.sm,
              backgroundColor: colors.brand.accentLight + '2E',
              borderWidth: 1,
              borderColor: colors.brand.accentLight + '59',
            }}
          >
            <Clock size={14} color={colors.brand.accentLight} strokeWidth={1.8} />
            <Text style={[typography.label, { color: colors.brand.accentLight }]}>{t('nav.watchTutorial')}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: spacing.sm }} contentContainerStyle={{ gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.route === activeRouteName;
            return (
              <Pressable
                key={item.labelKey}
                onPress={() => navigation.navigate(item.route, item.screen ? { screen: item.screen } : undefined)}
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.sm,
                  backgroundColor: active ? onBrandAlpha(0.12) : 'transparent',
                }}
              >
                <item.icon size={15} color={active ? colors.ink.onBrand : onBrandAlpha(0.7)} strokeWidth={1.6} />
                <Text style={[typography.bodyMedium, { color: active ? colors.ink.onBrand : onBrandAlpha(0.8), fontSize: 13 }]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: onBrandAlpha(0.15) }} />
          <Text numberOfLines={1} style={[typography.caption, { color: onBrandAlpha(0.7), flex: 1, textAlign: isUrdu ? 'right' : 'left' }]}>
            {name || t('nav.account')}
          </Text>
        </View>
      </SafeAreaView>

      <Modal visible={switcherOpen} transparent animationType="fade" onRequestClose={() => setSwitcherOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl }} onPress={() => setSwitcherOpen(false)}>
          <View style={{ backgroundColor: colors.surface.bg, borderRadius: radii.lg, padding: spacing.md }}>
            {shops.map((shop) => (
              <Pressable
                key={shop.id}
                onPress={() => {
                  setActiveShopId(String(shop.id));
                  setSwitcherOpen(false);
                }}
                style={{ paddingVertical: spacing.sm }}
              >
                <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{shop.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}
