import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import { ChevronDown, Menu, Boxes, Plus, Cloud, Coins, ShoppingCart, PackagePlus, Users, ReceiptText, Bell, AlertTriangle, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { PulseFab } from '../../components/motion/PulseFab';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ListRow } from '../../components/ui/ListRow';
import { AdBanner } from '../../components/ui/AdBanner';
import { BottomNav } from '../../components/ui/BottomNav';
import { useTheme } from '../../theme';
import { useDashboardStats, useSalesByProduct } from '../../hooks/useDashboard';
import { useShops } from '../../hooks/useShops';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useShopStore } from '../../store/shopStore';
import { useSyncStore } from '../../store/syncStore';
import { useCoinsStore } from '../../store/coinsStore';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';
import { useT, useIsUrdu } from '../../store/languageStore';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { formatCurrency } from '../../utils/money';
import { isLowStock, isOutOfStock } from '../../utils/stock';
import { formatRelativeTime } from '../../utils/dates';

export default function Dashboard() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const activeShop = shops.find((s) => String(s.id) === String(activeShopId));
  const businessLabel = activeShop?.shopTypeCode
    ? activeShop.shopTypeCode.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : t('dashboard.mainBranch');
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
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

  const billsUsedToday = useCoinsStore((s) => s.billsUsedToday);
  const freeDailyRecordLimit = useCoinsStore((s) => s.freeDailyRecordLimit);
  const adsWatchedToday = useCoinsStore((s) => s.adsWatchedToday);
  const maxRewardAdsPerDay = useCoinsStore((s) => s.maxRewardAdsPerDay);

  // "Daily usage" only means anything on the free tier — cloud-enabled plans
  // have no bill/ad-coin limits, so the card (and its refresh) is skipped
  // entirely for them.
  useFocusEffect(
    useCallback(() => {
      if (!entitlement?.cloudEnabled) {
        useCoinsStore.getState().refresh().catch(() => {});
      }
    }, [entitlement?.cloudEnabled])
  );

  const summary = stats?.summary || {};
  const chartData = (stats?.revenueAnalytics || []).map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: colors.brand.primary,
  }));
  const pendingDues = customers.reduce((sum, customer) => sum + Math.max(0, Number(customer.balance) || 0), 0);
  const lowStockCount = products.filter((product) => isLowStock(product) || isOutOfStock(product)).length;
  const quickActions = [
    { key: 'newSale', label: t('dashboard.quickNewSale'), icon: ShoppingCart, color: colors.brand.primary, route: 'BillingStack', screen: 'NewBill' },
    { key: 'addItem', label: t('dashboard.quickAddItem'), icon: PackagePlus, color: colors.semantic.success, route: 'CatalogStack', screen: 'AddProduct' },
    { key: 'customers', label: t('dashboard.quickCustomers'), icon: Users, color: colors.brand.accent, route: 'BillingStack', screen: 'CreditCustomers' },
    { key: 'expenses', label: t('nav.expenses'), icon: ReceiptText, color: colors.semantic.danger, route: 'Expenses' },
  ];

  return (
    <AnimatedScreen style={{ backgroundColor: colors.surface.bg }}>
      <View style={{ backgroundColor: colors.surface.bg }}>
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[typography.label, { color: colors.ink.onBrand }]}>{activeShop?.name?.slice(0, 2)?.toUpperCase() || 'AK'}</Text>
              </View>
              <View>
                <Text numberOfLines={1} style={[typography.h3, { color: colors.ink.primary, maxWidth: 190 }]}>{activeShop?.name || t('nav.selectShop')}</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{businessLabel}</Text>
              </View>
              <ChevronDown size={14} color={colors.ink.secondary} strokeWidth={1.8} />
            </Pressable>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
              <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8}><Bell size={20} color={colors.ink.primary} strokeWidth={1.8} /></Pressable>
              <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} hitSlop={8}><Menu size={20} color={colors.ink.primary} strokeWidth={1.8} /></Pressable>
            </View>
          </View>
          {entitlement?.cloudEnabled && syncStatusAlertsEnabled ? (
            <Pressable
              onPress={() => navigation.navigate('SettingsStack', { screen: 'SyncStatus' })}
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
            >
              <Cloud size={12} color={colors.ink.secondary} strokeWidth={1.8} />
              <Text style={[typography.caption, { color: colors.ink.secondary, fontSize: 11 }]}>
                {lastSyncAt ? t('dashboard.syncedRelative').replace('{time}', formatRelativeTime(lastSyncAt)) : t('dashboard.notSyncedYet')}
              </Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.brand.primary} />}
      >
        <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
          <StatCard value={formatCurrency(summary.totalSales)} label={t('dashboard.salesToday')} />
          <StatCard value={formatCurrency(summary.profitToday)} label={t('dashboard.profitToday')} tone="accent" />
        </View>

        <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
          <StatCard icon={<Boxes size={18} color={colors.brand.primary} />} value={String(products.length)} label={t('dashboard.itemsCount')} />
          <StatCard icon={<Users size={18} color={colors.semantic.success} />} value={String(customers.length)} label={t('dashboard.customersCount')} tone="success" />
        </View>
        <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
          <StatCard icon={<AlertTriangle size={18} color={colors.semantic.danger} />} value={String(lowStockCount)} label={t('dashboard.lowStockCount')} tone="danger" />
          <StatCard icon={<Wallet size={18} color={colors.brand.primary} />} value={formatCurrency(pendingDues)} label={t('dashboard.pendingDues')} />
        </View>

        <Text style={[typography.h3, { color: colors.ink.primary, textAlign, marginTop: spacing.sm }]}>{t('dashboard.quickActions')}</Text>
        <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
          {quickActions.map((action) => (
            <Pressable key={action.key} onPress={() => navigation.navigate(action.route, action.screen ? { screen: action.screen } : undefined)} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
              <View style={{ width: 52, height: 52, borderRadius: radii.md, backgroundColor: action.color + '16', alignItems: 'center', justifyContent: 'center' }}>
                <action.icon size={22} color={action.color} strokeWidth={1.9} />
              </View>
              <Text numberOfLines={1} style={[typography.label, { fontSize: 10, color: colors.ink.primary, textAlign: 'center' }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {!entitlement?.cloudEnabled ? (
          <Card>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <SectionHeader title={t('dashboard.dailyUsage')} style={{ marginBottom: 0, flex: 1, flexDirection: rowDirection }} />
              <Pressable onPress={() => navigation.navigate('EarnCoins')} hitSlop={8}>
                <Badge label={t('dashboard.earnCoins')} tone="brand" />
              </Pressable>
            </View>
            <View style={{ gap: spacing.sm }}>
              <ListRow
                style={{ paddingHorizontal: 0, flexDirection: rowDirection }}
                leading={<Coins size={16} color={colors.brand.accentDark} strokeWidth={1.8} />}
                title={t('dashboard.billsToday')}
                titleStyle={{ textAlign }}
                trailing={
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>
                    {billsUsedToday} / {freeDailyRecordLimit}
                  </Text>
                }
              />
              <ListRow
                style={{ paddingHorizontal: 0, flexDirection: rowDirection }}
                leading={<Coins size={16} color={colors.brand.accentDark} strokeWidth={1.8} />}
                title={t('dashboard.adsWatchedToday')}
                titleStyle={{ textAlign }}
                trailing={
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>
                    {adsWatchedToday} / {maxRewardAdsPerDay}
                  </Text>
                }
              />
            </View>
          </Card>
        ) : null}

        <AdBanner />

        <Card>
          <SectionHeader title={t('dashboard.revenueThisWeek')} style={{ flexDirection: rowDirection }} />
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
            <SectionHeader title={t('dashboard.topLowStocked')} style={{ flexDirection: rowDirection }} />
            {(stats?.lowStockAlerts || []).length === 0 ? (
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.nothingLowStock')}</Text>
            ) : (
              stats.lowStockAlerts.map((item) => (
                <ListRow
                  key={item.id}
                  style={{ paddingHorizontal: 0, flexDirection: rowDirection }}
                  title={item.name}
                  titleStyle={{ textAlign }}
                  trailing={
                    <Badge
                      label={item.stock <= 0 ? t('dashboard.out') : t('dashboard.left').replace('{count}', item.stock)}
                      tone={item.stock <= 0 ? 'danger' : 'warning'}
                    />
                  }
                />
              ))
            )}
          </Card>
        ) : null}

        <Card>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('dashboard.topProducts')}</Text>
            <Badge label={t('dashboard.syncedData')} tone="brand" />
          </View>
          {topProductsError ? (
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.couldntLoad')}</Text>
          ) : (topProducts?.data || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.noSalesYet')}</Text>
          ) : (
            topProducts.data.map((product) => (
              <ListRow
                key={product.productId}
                style={{ paddingHorizontal: 0, flexDirection: rowDirection }}
                title={product.name}
                titleStyle={{ textAlign }}
                trailing={<Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(product.revenue)}</Text>}
              />
            ))
          )}
        </Card>

        <Card>
          <SectionHeader title={t('dashboard.recentInvoices')} style={{ flexDirection: rowDirection }} />
          {(stats?.recentInvoices || []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.noInvoicesYet')}</Text>
          ) : (
            stats.recentInvoices.map((invoice) => (
              <ListRow
                key={invoice.id}
                style={{ paddingHorizontal: 0, flexDirection: rowDirection }}
                title={`#${invoice.id} · ${invoice.customer}`}
                titleStyle={{ textAlign }}
                trailing={
                  <Text style={[typography.bodyMedium, { color: invoice.status === 'PAID' ? colors.semantic.success : colors.semantic.warning }]}>
                    {invoice.status === 'PAID' ? t('dashboard.paid') : t('dashboard.pending')}
                  </Text>
                }
              />
            ))
          )}
        </Card>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 84, right: spacing.lg }}>
        <PulseFab
          onPress={() => navigation.navigate('BillingStack', { screen: 'NewBill' })}
          icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />}
        />
      </View>
      <BottomNav active="home" />
    </AnimatedScreen>
  );
}
