import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { House, ShoppingCart, Package, ChartNoAxesCombined, Menu } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

const tabs = [
  { key: 'home', label: 'nav.home', icon: House, route: 'HomeStack', screen: 'Dashboard' },
  { key: 'sales', label: 'nav.sales', icon: ShoppingCart, route: 'BillingStack', screen: 'NewBill' },
  { key: 'products', label: 'nav.products', icon: Package, route: 'CatalogStack', screen: 'ProductsList' },
  { key: 'reports', label: 'nav.reports', icon: ChartNoAxesCombined, route: 'SalesReport' },
  { key: 'more', label: 'nav.more', icon: Menu, route: 'SettingsStack', screen: 'Settings' },
];

export function BottomNav({ active }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface.raised, borderTopWidth: 1, borderTopColor: colors.surface.border }}>
      <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', minHeight: 60 }}>
        {tabs.map((tab) => {
          const selected = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={t(tab.label)}
              onPress={() => navigation.navigate(tab.route, tab.screen ? { screen: tab.screen } : undefined)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: spacing.xs }}
            >
              <tab.icon size={20} strokeWidth={selected ? 2.3 : 1.8} color={selected ? colors.brand.primary : colors.ink.secondary} />
              <Text numberOfLines={1} style={[typography.label, { fontSize: 10, color: selected ? colors.brand.primary : colors.ink.secondary }]}>
                {t(tab.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
