import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CalendarDays, Download, ReceiptText, Search, Eye, Pencil, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { Sheet } from '../../components/ui/Sheet';
import { Chip } from '../../components/ui/Chip';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useTheme } from '../../theme';
import { useBill, useBills, useRecordBillPayment } from '../../hooks/useBills';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { paymentTime } from '../../db/repositories/billSettlementRepository';
import { formatCurrency } from '../../utils/money';
import { shareRecordsReport } from '../../utils/recordsReport';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function Records() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { data: bills = [], isRefetching, refetch } = useBills();
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const activeShop = shops.find((shop) => String(shop.id) === String(activeShopId));
  const recordPayment = useRecordBillPayment();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const savingRef = useRef(false);
  const selected = bills.find((bill) => bill.id === selectedId);
  const { data: selectedDetail } = useBill(selectedId);

  useEffect(() => {
    if (route.params?.billId) {
      setSelectedId(route.params.billId);
      setSheet('detail');
    }
  }, [route.params?.billId]);

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

  function openSheet(bill, next) {
    savingRef.current = false;
    setSelectedId(bill.id);
    setAmount('');
    setError('');
    setSheet(next);
  }

  function closeSheet() {
    savingRef.current = false;
    setSheet(null);
    if (route.params?.billId) navigation.setParams({ billId: undefined });
  }

  function savePayment() {
    if (!selected || savingRef.current) return;
    savingRef.current = true;
    recordPayment.mutate({ billId: selected.id, amount }, {
      onSuccess: () => {
        setSheet('detail');
        setAmount('');
        setError('');
        showToast(t('records.paymentSaved'), 'success');
      },
      onError: (cause) => {
        savingRef.current = false;
        setError(cause.message?.startsWith('records.error.') ? t(cause.message) : t('records.paymentFailed'));
      },
    });
  }

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

  const summary = (label, value, accent) => (
    <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={[typography.body, { color: colors.ink.secondary, flex: 1, textAlign: align }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: accent || colors.ink.primary }]}>{value}</Text>
    </View>
  );

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={[typography.h1, { color: colors.ink.primary, textAlign: align }]}>{t('nav.records')}</Text>
          <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('records.subtitle')}</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <TextField value={search} onChangeText={setSearch} placeholder={t('records.search')} right={<Search size={16} color={colors.ink.secondary} />} />
        </View>
        <View style={{ flexDirection: direction, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          {['all', 'PAID', 'PENDING'].map((value) => (
            <Chip key={value} label={t(`records.${value.toLowerCase()}`)} selected={status === value} onPress={() => setStatus(value)} />
          ))}
        </View>
        <View style={{ flexDirection: direction, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Pressable onPress={() => setSheet('filter')} style={{ flex: 1, flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, backgroundColor: colors.surface.raised }}>
            <CalendarDays size={17} color={colors.brand.primary} />
            <Text numberOfLines={1} style={[typography.label, { color: colors.ink.primary }]}>{t(`records.period.${period}`)}</Text>
          </Pressable>
          <Pressable onPress={exportReport} disabled={exporting} style={{ flex: 1, flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.brand.primary, opacity: exporting ? 0.65 : 1 }}>
            <Download size={17} color={colors.ink.onBrand} />
            <Text style={[typography.label, { color: colors.ink.onBrand }]}>{exporting ? t('records.exporting') : t('records.exportPdf')}</Text>
          </Pressable>
        </View>
        <StaggeredList
          data={visible}
          keyExtractor={(bill) => bill.id}
          estimatedItemSize={108}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.sm }}>
              <ReceiptText size={32} color={colors.ink.secondary} />
              <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('records.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: colors.surface.card, borderColor: colors.surface.border, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.sm }}>
              <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{item.customerName}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>#{item.serverId || item.id.slice(0, 8)} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Badge label={t(`records.${item.status.toLowerCase()}`)} tone={item.status === 'PAID' ? 'success' : 'warning'} />
              </View>
              {summary(t('billing.total'), formatCurrency(item.totalAmount))}
              {item.remainingDue > 0 ? summary(t('billing.remainingDue'), formatCurrency(item.remainingDue), colors.semantic.warning) : null}
              <View style={{ flexDirection: direction, gap: spacing.sm }}>
                <Pressable accessibilityRole="button" onPress={() => openSheet(item, 'detail')} style={{ flex: 1, flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.surface.raised }}>
                  <Eye size={16} color={colors.brand.primary} />
                  <Text style={[typography.label, { color: colors.brand.primary }]}>{t('records.view')}</Text>
                </Pressable>
                {item.remainingDue > 0 && item.customerId ? (
                  <Pressable accessibilityRole="button" onPress={() => openSheet(item, 'payment')} style={{ flex: 1, flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.semantic.successBg }}>
                    <Pencil size={16} color={colors.brand.primary} />
                    <Text style={[typography.label, { color: colors.brand.primary }]}>{t('records.addPayment')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        />
      </SafeAreaView>

      <Sheet visible={sheet === 'detail' && !!selected} onClose={closeSheet} title={t('records.details')}>
        {selected ? <>
          {summary(t('records.customer'), selected.customerName)}
          {selected.customerPhone ? summary(t('records.phone'), selected.customerPhone) : null}
          {summary(t('records.date'), new Date(selected.createdAt).toLocaleString())}
          {summary(t('billing.total'), formatCurrency(selected.totalAmount))}
          {summary(t('records.paidAmount'), formatCurrency(Math.min(selected.totalAmount, selected.totalReceived)), colors.semantic.success)}
          {summary(t('billing.remainingDue'), formatCurrency(selected.remainingDue), selected.remainingDue ? colors.semantic.warning : colors.semantic.success)}
          <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align, marginTop: spacing.sm }]}>{t('records.items')}</Text>
          {(selectedDetail?.items || []).map((item) => (
            <View key={item.id} style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[typography.body, { color: colors.ink.primary, flex: 1, textAlign: align }]}>{item.productName}</Text>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align, marginTop: spacing.sm }]}>{t('records.paymentHistory')}</Text>
          {selected.totalReceived - selected.payments.reduce((sum, payment) => sum + payment.amount, 0) > 0 ? (
            <View style={{ flexDirection: direction, justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
              <Text style={[typography.body, { color: colors.ink.primary }]}>{t('records.atCheckout')}</Text>
              <Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>{formatCurrency(Math.min(selected.totalAmount, selected.totalReceived - selected.payments.reduce((sum, payment) => sum + payment.amount, 0)))}</Text>
            </View>
          ) : null}
          {selected.payments.map((payment) => (
            <View key={payment.id} style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
              <Wallet size={16} color={colors.semantic.success} />
              <Text style={[typography.caption, { flex: 1, color: colors.ink.secondary, textAlign: align }]}>{new Date(paymentTime(payment)).toLocaleString()}</Text>
              <Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))}
          {selected.totalReceived <= 0 ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('records.noPayments')}</Text> : null}
          {selected.remainingDue > 0 && selected.customerId ? <Button title={t('records.addPayment')} onPress={() => { savingRef.current = false; setAmount(''); setError(''); setSheet('payment'); }} /> : null}
        </> : null}
      </Sheet>

      <Sheet visible={sheet === 'payment' && !!selected} onClose={closeSheet} title={t('records.addPayment')}
        footer={<Button title={t('records.savePayment')} onPress={savePayment} />}>
        {selected ? <>
          <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{selected.customerName}</Text>
          {summary(t('billing.total'), formatCurrency(selected.totalAmount))}
          {summary(t('records.paidAmount'), formatCurrency(Math.min(selected.totalAmount, selected.totalReceived)))}
          {summary(t('billing.remainingDue'), formatCurrency(selected.remainingDue), colors.semantic.warning)}
          <TextField label={t('records.newAmount')} value={amount} onChangeText={(value) => { setAmount(value); setError(''); }} keyboardType="decimal-pad" placeholder="0" />
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}
        </> : null}
      </Sheet>

      <Sheet visible={sheet === 'filter'} onClose={closeSheet} title={t('records.dateFilter')}>
        {['all', 'today', 'week', 'month'].map((value) => (
          <Pressable key={value} onPress={() => { setPeriod(value); setSheet(null); }} style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{t(`records.period.${value}`)}</Text>
            {period === value ? <CheckMark colors={colors} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </AnimatedScreen>
  );
}

function CheckMark({ colors }) {
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand.primary }} />;
}
