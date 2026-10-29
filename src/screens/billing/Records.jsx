import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays, Download, Eye, Pencil, ReceiptText, Search } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Sheet } from '../../components/ui/Sheet';
import { Chip } from '../../components/ui/Chip';
import { Badge } from '../../components/ui/Badge';
import { TextField } from '../../components/ui/TextField';
import { useTheme } from '../../theme';
import { useBills } from '../../hooks/useBills';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';
import { shareRecordsReport } from '../../utils/recordsReport';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

const TABLE_WIDTH = 760;

export default function Records() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { data: bills = [], isRefetching, refetch } = useBills();
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const activeShop = shops.find((shop) => String(shop.id) === String(activeShopId));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return bills.filter((bill) => {
      if (status !== 'all' && bill.status !== status) return false;
      if (period !== 'all') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        if (period === 'week') start.setDate(start.getDate() - 6);
        if (period === 'month') start.setDate(start.getDate() - 29);
        if (new Date(bill.createdAt) < start) return false;
      }
      return !query || `${bill.customerName} ${bill.customerPhone || ''} ${bill.serverId || ''} ${bill.id}`.toLocaleLowerCase().includes(query);
    });
  }, [bills, search, status, period]);

  async function exportReport() {
    if (exporting) return;
    setExporting(true);
    try {
      await shareRecordsReport({ bills: visible, shopName: activeShop?.name, periodLabel: t(`records.period.${period}`) });
    } catch (cause) {
      showToast(cause?.message || t('records.exportFailed'), 'error');
    } finally {
      setExporting(false);
    }
  }

  const columns = { invoice: 105, customer: 145, total: 105, status: 100, date: 150, actions: 125 };
  const headerCell = (label, size, centered) => <Text style={[typography.caption, { width: size, color: colors.ink.secondary, textTransform: 'uppercase', textAlign: centered ? 'center' : align }]}>{label}</Text>;

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={[typography.h1, { color: colors.ink.primary, textAlign: align }]}>{t('nav.records')}</Text>
          <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('records.subtitle')}</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: direction, gap: spacing.sm }}>
            <TextField style={{ flex: 1 }} value={search} onChangeText={setSearch} placeholder={t('records.search')} right={<Search size={16} color={colors.ink.secondary} />} />
            <Pressable onPress={() => setFilterOpen(true)} style={{ width: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, backgroundColor: colors.surface.raised }}><CalendarDays size={19} color={colors.brand.primary} /></Pressable>
          </View>
          <View style={{ flexDirection: direction, gap: spacing.sm }}>
            {['all', 'PAID', 'PENDING'].map((value) => <Chip key={value} label={t(`records.${value.toLowerCase()}`)} selected={status === value} onPress={() => setStatus(value)} />)}
          </View>
          <Pressable onPress={exportReport} disabled={exporting} style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 42, borderRadius: radii.md, backgroundColor: colors.brand.primary, opacity: exporting ? 0.65 : 1 }}><Download size={17} color={colors.ink.onBrand} /><Text style={[typography.label, { color: colors.ink.onBrand }]}>{exporting ? t('records.exporting') : t('records.exportPdf')}</Text></Pressable>
        </View>

        <View style={{ flex: 1, margin: spacing.lg, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface.card }}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: Math.max(TABLE_WIDTH, width - spacing.lg * 2) }}>
            <View style={{ width: Math.max(TABLE_WIDTH, width - spacing.lg * 2), flex: 1 }}>
              <View style={{ flexDirection: direction, alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface.raised, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
                {headerCell(t('records.invoice'), columns.invoice)}
                {headerCell(t('records.customer'), columns.customer)}
                {headerCell(t('billing.total'), columns.total)}
                {headerCell(t('records.status'), columns.status, true)}
                {headerCell(t('records.date'), columns.date)}
                {headerCell(t('records.actions'), columns.actions, true)}
              </View>
              <FlatList
                data={visible}
                keyExtractor={(bill) => bill.id}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand.primary} />}
                ListEmptyComponent={<View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.sm }}><ReceiptText size={32} color={colors.ink.secondary} /><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('records.empty')}</Text></View>}
                renderItem={({ item }) => {
                  const canEdit = item.remainingDue > 0 && item.customerId;
                  return <View style={{ flexDirection: direction, alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
                    <Text numberOfLines={1} style={[typography.bodyMedium, { width: columns.invoice, color: colors.ink.primary, textAlign: align }]}>#{item.serverId || item.id.slice(0, 8)}</Text>
                    <View style={{ width: columns.customer }}><Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{item.customerName}</Text>{item.customerPhone ? <Text numberOfLines={1} style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{item.customerPhone}</Text> : null}</View>
                    <Text style={[typography.bodyMedium, { width: columns.total, color: colors.ink.primary, textAlign: align }]}>{formatCurrency(item.totalAmount)}</Text>
                    <View style={{ width: columns.status, alignItems: 'center' }}><Badge label={t(`records.${item.status.toLowerCase()}`)} tone={item.status === 'PAID' ? 'success' : 'warning'} /></View>
                    <View style={{ width: columns.date }}><Text style={[typography.body, { color: colors.ink.primary, textAlign: align }]}>{new Date(item.createdAt).toLocaleDateString()}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
                    <View style={{ width: columns.actions, flexDirection: direction, justifyContent: 'center', gap: spacing.sm }}>
                      <Action icon={Eye} label={t('records.view')} onPress={() => navigation.navigate('RecordDetail', { billId: item.id })} colors={colors} radii={radii} />
                      <Action icon={Pencil} label={t('records.edit')} onPress={() => canEdit && navigation.navigate('RecordPayment', { billId: item.id })} disabled={!canEdit} colors={colors} radii={radii} />
                    </View>
                  </View>;
                }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title={t('records.dateFilter')}>
        {['all', 'today', 'week', 'month'].map((value) => <Pressable key={value} onPress={() => { setPeriod(value); setFilterOpen(false); }} style={{ flexDirection: direction, justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}><Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{t(`records.period.${value}`)}</Text>{period === value ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand.primary }} /> : null}</Pressable>)}
      </Sheet>
    </AnimatedScreen>
  );
}

function Action({ icon: Icon, label, onPress, disabled, colors, radii }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.sm, backgroundColor: colors.surface.raised, opacity: disabled ? 0.35 : 1 }}><Icon size={17} color={disabled ? colors.ink.secondary : colors.brand.primary} /></Pressable>;
}
