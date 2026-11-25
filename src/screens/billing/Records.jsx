import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Download, Eye, Pencil, ReceiptText, Search } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
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
import { DateFilterSection } from '../../components/ui/DateFilterSection';
import { DateFilterSheet } from '../../components/ui/DateFilterSheet';
import { DataTable } from '../../components/ui/DataTable';
import { dateIsInRange, dateRangeForPreset, dateRangeLabel } from '../../utils/dateRanges';

export default function Records() {
  const navigation = useNavigation();
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
  const [dateRange, setDateRange] = useState(() => dateRangeForPreset('allTime'));
  const [dateRangeId, setDateRangeId] = useState('allTime');
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return bills.filter((bill) => {
      if (status !== 'all' && bill.status !== status) return false;
      if (!dateIsInRange(bill.createdAt, dateRange)) return false;
      return !query || `${bill.customerName} ${bill.customerPhone || ''} ${bill.serverId || ''} ${bill.id}`.toLocaleLowerCase().includes(query);
    });
  }, [bills, search, status, dateRange]);

  async function exportReport() {
    if (exporting) return;
    setExporting(true);
    try {
      await shareRecordsReport({ bills: visible, shopName: activeShop?.name, periodLabel: dateRangeLabel(dateRange, dateRangeId, t) });
    } catch (cause) {
      showToast(cause?.message || t('records.exportFailed'), 'error');
    } finally {
      setExporting(false);
    }
  }

  const columns = [
    { key: 'invoice', label: t('records.invoice'), width: 105, render: (item) => `#${item.serverId || item.id.slice(0, 8)}` },
    { key: 'customer', label: t('records.customer'), width: 145, render: (item) => <View><Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{item.customerName}</Text>{item.customerPhone ? <Text numberOfLines={1} style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{item.customerPhone}</Text> : null}</View> },
    { key: 'total', label: t('billing.total'), width: 105, render: (item) => formatCurrency(item.totalAmount) },
    { key: 'status', label: t('records.status'), width: 100, align: 'center', render: (item) => <Badge label={t(`records.${item.status.toLowerCase()}`)} tone={item.status === 'PAID' ? 'success' : 'warning'} /> },
    { key: 'date', label: t('records.date'), width: 150, render: (item) => <View><Text style={[typography.body, { color: colors.ink.primary, textAlign: align }]}>{new Date(item.createdAt).toLocaleDateString()}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View> },
    { key: 'actions', label: t('records.actions'), width: 125, align: 'center', render: (item) => { const canEdit = item.remainingDue > 0 && item.customerId; return <View style={{ flexDirection: direction, justifyContent: 'center', gap: spacing.sm }}><Action icon={Eye} label={t('records.view')} onPress={() => navigation.navigate('RecordDetail', { billId: item.id })} colors={colors} radii={radii} /><Action icon={Pencil} label={t('records.edit')} onPress={() => canEdit && navigation.navigate('RecordPayment', { billId: item.id })} disabled={!canEdit} colors={colors} radii={radii} /></View>; } },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('nav.records')} subtitle={t('records.subtitle')} />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <TextField value={search} onChangeText={setSearch} placeholder={t('records.search')} right={<Search size={16} color={colors.ink.secondary} />} />
          <DateFilterSection selectedRange={dateRangeLabel(dateRange, dateRangeId, t)} onPress={() => setFilterOpen(true)} />
          <View style={{ flexDirection: direction, gap: spacing.sm }}>
            {['all', 'PAID', 'PENDING'].map((value) => <Chip key={value} label={t(`records.${value.toLowerCase()}`)} selected={status === value} onPress={() => setStatus(value)} />)}
          </View>
          <Pressable onPress={exportReport} disabled={exporting} style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 42, borderRadius: radii.md, backgroundColor: colors.brand.primary, opacity: exporting ? 0.65 : 1 }}><Download size={17} color={colors.ink.onBrand} /><Text style={[typography.label, { color: colors.ink.onBrand }]}>{exporting ? t('records.exporting') : t('records.exportPdf')}</Text></Pressable>
        </View>

        <View style={{ flex: 1, margin: spacing.lg }}>
          <DataTable columns={columns} data={visible} keyExtractor={(bill) => bill.id} refreshing={isRefetching} onRefresh={refetch} estimatedItemSize={66} renderEmpty={<View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.sm }}><ReceiptText size={32} color={colors.ink.secondary} /><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('records.empty')}</Text></View>} />
        </View>
      </SafeAreaView>
      <DateFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={dateRange}
        showAllTime
        onSelect={(range, label) => {
          setDateRange(range);
          setDateRangeId(label);
        }}
      />
    </AnimatedScreen>
  );
}

function Action({ icon: Icon, label, onPress, disabled, colors, radii }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.sm, backgroundColor: colors.surface.raised, opacity: disabled ? 0.35 : 1 }}><Icon size={17} color={disabled ? colors.ink.secondary : colors.brand.primary} /></Pressable>;
}
