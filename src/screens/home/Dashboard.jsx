import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { BarChart } from 'react-native-gifted-charts';
import { ChevronDown, Menu, Boxes, Plus, Cloud, Coins } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { PulseFab } from '../../components/motion/PulseFab';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ListRow } from '../../components/ui/ListRow';
import { AdBanner } from '../../components/ui/AdBanner';
import { useTheme } from '../../theme';
import { useDashboardStats, useSalesByProduct } from '../../hooks/useDashboard';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { useSyncStore } from '../../store/syncStore';
import { useCoinsStore } from '../../store/coinsStore';
import { useNotificationPrefsStore } from '../../store/notificationPrefsStore';
import { useT, useIsUrdu } from '../../store/languageStore';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { formatCurrency } from '../../utils/money';
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

  return (
    <AnimatedScreen style={{ backgroundColor: colors.surface.bg }}>
      <LinearGradient colors={colors.gradient.header}>
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: radii.pill,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.onBrand, maxWidth: 160 }]}>
                {activeShop?.name || t('nav.selectShop')}
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
              style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
            >
              <Cloud size={12} color={colors.ink.onBrand} strokeWidth={1.8} opacity={0.75} />
              <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.75, fontSize: 11 }]}>
                {lastSyncAt ? t('dashboard.syncedRelative').replace('{time}', formatRelativeTime(lastSyncAt)) : t('dashboard.notSyncedYet')}
              </Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.brand.primary} />}
      >
        <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
          <StatCard value={formatCurrency(summary.totalSales)} label={t('dashboard.salesToday')} />
          <StatCard value={formatCurrency(summary.profitToday)} label={t('dashboard.profitToday')} tone="accent" />
        </View>

        <StatCard
          icon={<Boxes size={18} color={colors.brand.primary} />}
          value={formatCurrency(summary.totalInventoryValue)}
          label={t('dashboard.totalStockValue')}
        />

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

      <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
        <PulseFab
          onPress={() => navigation.navigate('BillingStack', { screen: 'NewBill' })}
          icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />}
        />
      </View>
    </AnimatedScreen>
  );
}
