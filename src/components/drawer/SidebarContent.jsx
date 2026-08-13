import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useShopStore } from '../../store/shopStore';
import { useShops } from '../../hooks/useShops';
import { NavIcons } from './navIcons';

const NAV_ITEMS = [
  { route: 'HomeStack', label: 'Dashboard', icon: 'dashboard' },
  { route: 'BillingStack', screen: 'NewBill', label: 'Billing', icon: 'billing' },
  { route: 'CatalogStack', label: 'Products & Stock', icon: 'products' },
  { route: 'BillingStack', screen: 'CreditCustomers', label: 'Credit Customers', icon: 'creditCustomers' },
  { route: 'SalesReport', label: 'Reports', icon: 'reports' },
  { route: 'ShopsStack', label: 'My Shops', icon: 'shops' },
  { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
  { route: 'SubscriptionPlans', label: 'Subscription', icon: 'subscription' },
  { route: 'SettingsStack', label: 'Settings', icon: 'settings' },
];

export function SidebarContent({ navigation, state }) {
  const { colors, typography, radii, spacing } = useTheme();
  const name = useAuthStore((s) => s.name);
  const activeShopId = useShopStore((s) => s.activeShopId);
  const setActiveShopId = useShopStore((s) => s.setActiveShopId);
  const { data: shops = [] } = useShops();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const activeRouteName = state.routes[state.index]?.name;
  const activeShop = shops.find((s) => String(s.id) === String(activeShopId));

  return (
    <LinearGradient colors={colors.gradient.header} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: spacing.md }}>
          <Pressable onPress={() => setSwitcherOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 32, height: 32, borderRadius: radii.sm, overflow: 'hidden' }}>
              <LinearGradient colors={colors.gradient.accent} style={{ flex: 1 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[typography.bodyMedium, { color: '#FAF9F6' }]}>
                {activeShop?.name || 'Select a shop'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[typography.caption, { color: 'rgba(250,249,246,0.55)', fontSize: 9 }]}>
                  {activeShop?.shopTypeCode || ''} · Switch shop
                </Text>
                {NavIcons.chevronDown('rgba(250,249,246,0.55)')}
              </View>
            </View>
          </Pressable>
        </View>

        <View style={{ padding: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              borderRadius: radii.md,
              padding: spacing.sm,
              backgroundColor: colors.brand.accentLight + '2E',
              borderWidth: 1,
              borderColor: colors.brand.accentLight + '59',
            }}
          >
            {NavIcons.clock(colors.brand.accentLight)}
            <Text style={[typography.label, { color: colors.brand.accentLight }]}>Watch Tutorial</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: spacing.sm }} contentContainerStyle={{ gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.route === activeRouteName;
            return (
              <Pressable
                key={item.label}
                onPress={() => navigation.navigate(item.route, item.screen ? { screen: item.screen } : undefined)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.sm,
                  backgroundColor: active ? 'rgba(250,249,246,0.12)' : 'transparent',
                }}
              >
                {NavIcons[item.icon](active ? '#FAF9F6' : 'rgba(250,249,246,0.7)')}
                <Text style={[typography.bodyMedium, { color: active ? '#FAF9F6' : 'rgba(250,249,246,0.8)', fontSize: 13 }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(250,249,246,0.15)' }} />
          <Text numberOfLines={1} style={[typography.caption, { color: 'rgba(250,249,246,0.7)', flex: 1 }]}>
            {name || 'Account'}
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
