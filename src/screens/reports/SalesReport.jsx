import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../theme';
import { useSalesReport } from '../../hooks/useSalesReport';
import { useProfitMarginTrend } from '../../hooks/useDashboard';
import { dashboardApi } from '../../services/dashboardApi';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';

const PERIODS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year', cloud: true },
];

export default function SalesReport() {
  const { colors, radii, typography, spacing } = useTheme();
  const [period, setPeriod] = useState('week');
  const isCloudPeriod = period === 'year';
  const activeShopId = useShopStore((s) => s.activeShopId);

  const { data: report } = useSalesReport(isCloudPeriod ? 'month' : period, { enabled: !isCloudPeriod });
  const { data: marginTrend, isError: marginTrendError } = useProfitMarginTrend({ period: 'year' });

  async function handleExport() {
    if (isCloudPeriod) {
      const csv = await dashboardApi.exportCsv({ report: 'profit-margin', period: 'year', shopId: activeShopId });
      const uri = FileSystem.cacheDirectory + `asaankhata-profit-margin-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
      return;
    }

    if (!report) return;
    const rowsHtml = report.topProducts.map((p) => `<tr><td>${p.name}</td><td style="text-align:right">${formatCurrency(p.total)}</td></tr>`).join('');
    const html = `
      <html><body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;">
        <h2>Sales Report — ${period === 'week' ? 'This Week' : 'This Month'}</h2>
        <p>Net Profit: <b>${formatCurrency(report.netProfit)}</b></p>
        <p>Revenue: <b>${formatCurrency(report.revenue)}</b> · Bills: <b>${report.billCount}</b></p>
        <h3>Top Products</h3>
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm }}>
          <Text style={[typography.h1, { color: colors.ink.primary }]}>Reports</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.pill,
                  backgroundColor: active ? colors.brand.primary : 'transparent',
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.surface.border,
                }}
              >
                <Text style={[typography.label, { color: active ? '#FAF9F6' : colors.ink.secondary }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          {isCloudPeriod ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.ink.secondary, flex: 1 }]}>
                  Year-long trends are computed on the server from synced data — run a sync first if this looks empty.
                </Text>
                <Badge label="Synced data" tone="brand" />
              </View>

              <Card>
                <Text style={[typography.h3, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Monthly revenue &amp; margin</Text>
                {marginTrendError ? (
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>Couldn't load — check your connection.</Text>
                ) : (marginTrend?.data || []).every((m) => !m.revenue) ? (
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>No synced sales data for this year yet.</Text>
                ) : (
                  marginTrend.data.map((m) => (
                    <View key={m.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                      <Text style={[typography.body, { color: colors.ink.primary }]}>{m.label}</Text>
                      <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>
                        {formatCurrency(m.revenue)} · {m.marginPct}% margin
                      </Text>
                    </View>
                  ))
                )}
              </Card>
            </>
          ) : (
            <>
              <LinearGradient colors={colors.gradient.header} style={{ borderRadius: radii.lg, padding: spacing.md }}>
                <Text style={[typography.caption, { color: 'rgba(250,249,246,0.7)' }]}>Net Profit</Text>
                <Text style={[typography.numericLarge, { color: '#FAF9F6', marginTop: 2 }]}>{formatCurrency(report?.netProfit)}</Text>
              </LinearGradient>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Card style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>Revenue</Text>
                  <Text style={[typography.h3, { color: colors.ink.primary, marginTop: 2 }]}>{formatCurrency(report?.revenue)}</Text>
                </Card>
                <Card style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>Bills</Text>
                  <Text style={[typography.h3, { color: colors.ink.primary, marginTop: 2 }]}>{report?.billCount ?? 0}</Text>
                </Card>
              </View>

              <Card>
                <Text style={[typography.h3, { color: colors.ink.primary, marginBottom: spacing.sm }]}>Top Products</Text>
                {(report?.topProducts || []).length === 0 ? (
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>No sales in this period yet.</Text>
                ) : (
                  report.topProducts.map((p) => (
                    <View key={p.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                      <Text style={[typography.body, { color: colors.ink.primary }]}>{p.name}</Text>
                      <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(p.total)}</Text>
                    </View>
                  ))
                )}
              </Card>
            </>
          )}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button
            title="Export Report"
            variant="outline"
            onPress={handleExport}
            icon={
              <Svg width={15} height={15} viewBox="0 0 16 16">
                <Path d="M8 2v9M4.5 8 8 11.5 11.5 8" stroke={colors.brand.primary} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M2 13h12" stroke={colors.brand.primary} strokeWidth={1.5} />
              </Svg>
            }
          />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
