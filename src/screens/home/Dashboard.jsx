import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import Svg, { Path, Line } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { PulseFab } from '../../components/motion/PulseFab';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../theme';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';

export default function Dashboard() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const activeShop = shops.find((s) => String(s.id) === String(activeShopId));
  const { data: stats, isLoading } = useDashboardStats();

  const summary = stats?.summary || {};
  const chartData = (stats?.revenueAnalytics || []).map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: colors.brand.primary,
  }));

  return (
    <AnimatedScreen style={{ backgroundColor: colors.surface.bg }}>
      <LinearGradient colors={colors.gradient.header}>
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: radii.pill,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text numberOfLines={1} style={[typography.bodyMedium, { color: '#FAF9F6', maxWidth: 160 }]}>
                {activeShop?.name || 'Select a shop'}
              </Text>
              <Svg width={12} height={12} viewBox="0 0 16 16">
                <Path d="M4 6l4 4 4-4" stroke="#FAF9F6" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={8}>
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Line x1={3} y1={6} x2={17} y2={6} stroke="#FAF9F6" strokeWidth={1.8} strokeLinecap="round" />
                <Line x1={3} y1={10} x2={17} y2={10} stroke="#FAF9F6" strokeWidth={1.8} strokeLinecap="round" />
                <Line x1={3} y1={14} x2={17} y2={14} stroke="#FAF9F6" strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Sales today</Text>
            <Text style={[typography.numericLarge, { color: colors.ink.primary, marginTop: 2 }]}>{formatCurrency(summary.totalSales)}</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Profit today</Text>
            <Text style={[typography.numericLarge, { color: colors.brand.accentDark, marginTop: 2 }]}>{formatCurrency(summary.profitToday)}</Text>
          </Card>
        </View>

        <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Total stock value</Text>
            <Text style={[typography.numericLarge, { color: colors.ink.primary, marginTop: 2 }]}>{formatCurrency(summary.totalInventoryValue)}</Text>
          </View>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M4 8l8-5 8 5-8 5-8-5z" fill="none" stroke={colors.brand.primary} strokeWidth={1.4} strokeLinejoin="round" />
            <Path d="M4 8v9l8 5 8-5V8" fill="none" stroke={colors.brand.primary} strokeWidth={1.4} strokeLinejoin="round" />
          </Svg>
        </Card>

        <Card>
          <Text style={[typography.h3, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Revenue this week</Text>
          {chartData.length ? (
            <BarChart
              data={chartData}
              barWidth={18}
              spacing={18}
              roundedTop
              hideRules
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={0}
              height={80}
              noOfSections={3}
            />
          ) : null}
        </Card>

        <Card>
          <Text style={[typography.h3, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Top 5 low stocked items</Text>
          {(stats?.lowStockAlerts || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Nothing low on stock right now.</Text>
          ) : (
            stats.lowStockAlerts.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}>
                <Text style={[typography.body, { color: colors.ink.primary }]}>{item.name}</Text>
                <Badge label={item.stock <= 0 ? 'Out' : `${item.stock} left`} tone={item.stock <= 0 ? 'danger' : 'warning'} />
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={[typography.h3, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Recent invoices</Text>
          {(stats?.recentInvoices || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>No invoices yet.</Text>
          ) : (
            stats.recentInvoices.map((invoice) => (
              <View key={invoice.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}>
                <Text style={[typography.body, { color: colors.ink.primary }]}>
                  #{invoice.id} · {invoice.customer}
                </Text>
                <Text style={[typography.bodyMedium, { color: invoice.status === 'PAID' ? colors.semantic.success : colors.semantic.warning }]}>
                  {invoice.status === 'PAID' ? 'Paid' : 'Pending'}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
        <PulseFab
          onPress={() => navigation.navigate('BillingStack', { screen: 'NewBill' })}
          icon={
            <Svg width={22} height={22} viewBox="0 0 16 16">
              <Path d="M8 2v12M2 8h12" stroke={colors.ink.primary} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          }
        />
      </View>
    </AnimatedScreen>
  );
}
