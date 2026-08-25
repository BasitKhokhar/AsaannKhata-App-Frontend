import React from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import { ChevronDown, Menu, Boxes, Plus, Cloud } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { PulseFab } from '../../components/motion/PulseFab';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ListRow } from '../../components/ui/ListRow';
import { useTheme } from '../../theme';
import { useDashboardStats, useSalesByProduct } from '../../hooks/useDashboard';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { useSyncStore } from '../../store/syncStore';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';

export default function Dashboard() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const activeShop = shops.find((s) => String(s.id) === String(activeShopId));
  const { data: stats, isLoading, isRefetching, refetch } = useDashboardStats();
  const { data: topProducts, isError: topProductsError, refetch: refetchTopProducts } = useSalesByProduct({ limit: 5 });

  function handleRefresh() {
    refetch();
    refetchTopProducts();
  }
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const entitlement = entitlementRepository.get();
  const lowStockAlertsEnabled = useNotificationPrefsStore((s) => s.lowStockAlerts);
  const syncStatusAlertsEnabled = useNotificationPrefsStore((s) => s.syncStatusAlerts);

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
              <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.onBrand, maxWidth: 160 }]}>
                {activeShop?.name || 'Select a shop'}
              </Text>
              <ChevronDown size={12} color={colors.ink.onBrand} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={8}>
              <Menu size={20} color={colors.ink.onBrand} strokeWidth={1.8} />
            </Pressable>
          </View>
          {entitlement?.cloudEnabled && syncStatusAlertsEnabled ? (
            <Pressable
              onPress={() => navigation.navigate('SettingsStack', { screen: 'SyncStatus' })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
            >
              <Cloud size={12} color={colors.ink.onBrand} strokeWidth={1.8} opacity={0.75} />
              <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.75, fontSize: 11 }]}>
                {lastSyncAt ? `Synced ${formatRelativeTime(lastSyncAt)}` : 'Not synced yet'}
              </Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.brand.primary} />}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatCard value={formatCurrency(summary.totalSales)} label="Sales today" />
          <StatCard value={formatCurrency(summary.profitToday)} label="Profit today" tone="accent" />
        </View>

        <StatCard
          icon={<Boxes size={18} color={colors.brand.primary} />}
          value={formatCurrency(summary.totalInventoryValue)}
          label="Total stock value"
        />

        <Card>
          <SectionHeader title="Revenue this week" />
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
              xAxisLabelTextStyle={{ color: colors.ink.secondary, fontSize: 11 }}
              height={80}
              noOfSections={3}
            />
          ) : null}
        </Card>

        {lowStockAlertsEnabled ? (
          <Card>
            <SectionHeader title="Top 5 low stocked items" />
            {(stats?.lowStockAlerts || []).length === 0 ? (
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>Nothing low on stock right now.</Text>
            ) : (
              stats.lowStockAlerts.map((item) => (
                <ListRow
                  key={item.id}
                  style={{ paddingHorizontal: 0 }}
                  title={item.name}
                  trailing={<Badge label={item.stock <= 0 ? 'Out' : `${item.stock} left`} tone={item.stock <= 0 ? 'danger' : 'warning'} />}
                />
              ))
            )}
          </Card>
        ) : null}

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.h3, { color: colors.ink.primary }]}>Top products</Text>
            <Badge label="Synced data" tone="brand" />
          </View>
          {topProductsError ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Couldn't load — check your connection.</Text>
          ) : (topProducts?.data || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>No sales yet for this shop.</Text>
          ) : (
            topProducts.data.map((product) => (
              <ListRow
                key={product.productId}
                style={{ paddingHorizontal: 0 }}
                title={product.name}
                trailing={<Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(product.revenue)}</Text>}
              />
            ))
          )}
        </Card>

        <Card>
          <SectionHeader title="Recent invoices" />
          {(stats?.recentInvoices || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>No invoices yet.</Text>
          ) : (
            stats.recentInvoices.map((invoice) => (
              <ListRow
                key={invoice.id}
                style={{ paddingHorizontal: 0 }}
                title={`#${invoice.id} · ${invoice.customer}`}
                trailing={
                  <Text style={[typography.bodyMedium, { color: invoice.status === 'PAID' ? colors.semantic.success : colors.semantic.warning }]}>
                    {invoice.status === 'PAID' ? 'Paid' : 'Pending'}
                  </Text>
                }
              />
            ))
          )}
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
        <PulseFab
          onPress={() => navigation.navigate('BillingStack', { screen: 'NewBill' })}
          icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />}
        />
      </View>
    </AnimatedScreen>
  );
}
