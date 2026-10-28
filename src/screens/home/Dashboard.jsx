import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import { ChevronDown, Menu, Boxes, Plus, Cloud, Coins, Users, Bell, AlertTriangle, Wallet, BadgeDollarSign, TrendingUp, PlayCircle } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { PulseFab } from '../../components/motion/PulseFab';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
  const { data: stats, isRefetching, refetch } = useDashboardStats();
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
  const adCoins = useCoinsStore((s) => s.adCoins);
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
  const metrics = [
    { key: 'sales', label: t('dashboard.salesToday'), value: formatCurrency(summary.totalSales), icon: BadgeDollarSign, color: colors.brand.primary },
    { key: 'profit', label: t('dashboard.profitToday'), value: formatCurrency(summary.profitToday), icon: TrendingUp, color: colors.semantic.success },
    { key: 'items', label: t('dashboard.itemsCount'), value: String(products.length), icon: Boxes, color: colors.brand.accent },
    { key: 'customers', label: t('dashboard.customersCount'), value: String(customers.length), icon: Users, color: colors.semantic.success },
    { key: 'lowStock', label: t('dashboard.lowStockCount'), value: String(lowStockCount), icon: AlertTriangle, color: colors.semantic.danger },
    { key: 'dues', label: t('dashboard.pendingDues'), value: formatCurrency(pendingDues), icon: Wallet, color: colors.semantic.warning },
  ];

  return (
    <AnimatedScreen style={{ backgroundColor: colors.surface.bg }}>
      <View style={{ flex: 1 }}>
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
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 96, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.brand.primary} />}
        >
        {!entitlement?.cloudEnabled ? (
          <Card style={{ padding: spacing.md, gap: spacing.md }} level="sm">
            <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.semantic.warningBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={17} color={colors.semantic.warning} strokeWidth={2} />
                </View>
                <Text style={[typography.h3, { color: colors.ink.primary, fontSize: 16 }]}>{t('dashboard.dailyUsage')}</Text>
              </View>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 5, backgroundColor: colors.semantic.warningBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill }}>
                <Coins size={15} color={colors.semantic.warning} strokeWidth={2} />
                <Text style={[typography.label, { color: colors.semantic.warning }]}>{adCoins}</Text>
              </View>
            </View>
            <View style={{ flexDirection: rowDirection, alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('dashboard.billsToday')}</Text>
                <Text style={[typography.h2, { color: colors.ink.primary, fontSize: 20 }]}>{billsUsedToday}/{freeDailyRecordLimit}</Text>
              </View>
              <View style={{ width: 1, height: 38, backgroundColor: colors.surface.border }} />
              <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('dashboard.adsWatchedToday')}</Text>
                <Text style={[typography.h2, { color: colors.ink.primary, fontSize: 20 }]}>{adsWatchedToday}/{maxRewardAdsPerDay}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('EarnCoins')}
              style={({ pressed }) => ({ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.brand.primary + '40', backgroundColor: colors.brand.accentLight, opacity: pressed ? 0.72 : 1 })}
            >
              <PlayCircle size={17} color={colors.brand.primary} strokeWidth={2} />
              <Text style={[typography.label, { color: colors.brand.primary }]}>{t('dashboard.earnCoins')}</Text>
            </Pressable>
          </Card>
        ) : null}

        <AdBanner />

        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: spacing.sm }}>
          {metrics.map((metric) => (
            <Card key={metric.key} style={{ width: '31.5%', minHeight: 112, padding: spacing.md, justifyContent: 'space-between' }} level="xs">
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: metric.color + '16', alignItems: 'center', justifyContent: 'center' }}>
                <metric.icon size={16} color={metric.color} strokeWidth={2} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[typography.h3, { color: colors.ink.primary, fontSize: 15, textAlign }]}>{metric.value}</Text>
              <Text numberOfLines={2} style={[typography.caption, { color: colors.ink.secondary, fontSize: 9, lineHeight: 12, textTransform: 'uppercase', textAlign }]}>{metric.label}</Text>
            </Card>
          ))}
        </View>

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

        <View style={{ position: 'absolute', bottom: 16, right: spacing.lg }}>
          <PulseFab
            onPress={() => navigation.navigate('BillingStack', { screen: 'NewBill' })}
            icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />}
          />
        </View>
      </View>
      <BottomNav active="home" />
    </AnimatedScreen>
  );
}
