import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Banknote, Check, CreditCard, HandCoins, Minus, Plus, Smartphone, Trash2 } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Sheet } from '../../components/ui/Sheet';
import { Chip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme';
import { useCartStore } from '../../store/cartStore';
import { useCustomers } from '../../hooks/useCustomers';
import { useCreateBill } from '../../hooks/useBills';
import { formatCurrency } from '../../utils/money';
import { useT, useIsUrdu } from '../../store/languageStore';

const methods = [
  { key: 'CASH', label: 'billing.payment.cash', icon: Banknote },
  { key: 'CARD', label: 'billing.payment.card', icon: CreditCard },
  { key: 'MOBILE_WALLET', label: 'billing.payment.wallet', icon: Smartphone },
  { key: 'CREDIT', label: 'billing.payment.credit', icon: HandCoins },
];
const round2 = (value) => Math.round(value * 100) / 100;

function lineQuantity(line) {
  if (line.stockType === 'PACK') return line.packQuantity || 1;
  return line.quantity || 1;
}

function recalculate(line, quantity) {
  if (line.stockType === 'AREA') {
    const totalArea = (line.unitArea || 0) * quantity;
    return { quantity, totalArea, total: round2(totalArea * line.pricePerUnit) };
  }
  if (line.stockType === 'LENGTH') {
    const lengthCm = quantity * 100;
    return { quantity, lengthCm, total: round2(lengthCm * line.pricePerUnit) };
  }
  if (line.stockType === 'PACK') return { quantity, packQuantity: quantity, total: round2(quantity * line.pricePerUnit) };
  return { quantity, total: round2(quantity * line.pricePerUnit) };
}

export default function Payment() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const cart = useCartStore();
  const { data: customers = [] } = useCustomers();
  const createBill = useCreateBill();
  const [method, setMethod] = useState('CASH');
  const [receivedInput, setReceivedInput] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = round2(cart.subtotal());
  const discountInput = Math.max(0, Number(cart.overallDiscount) || 0);
  const discount = round2(cart.discountType === 'percent' ? subtotal * Math.min(100, discountInput) / 100 : discountInput);
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxPercent = Math.min(100, Math.max(0, Number(cart.taxPercent) || 0));
  const taxAmount = round2(afterDiscount * taxPercent / 100);
  const total = round2(afterDiscount + taxAmount);
  const received = method === 'CREDIT' ? 0 : Number(receivedInput == null ? total : receivedInput);
  const safeReceived = Number.isFinite(received) ? received : 0;
  const remainingDue = round2(Math.max(0, total - safeReceived));
  const changeDue = round2(Math.max(0, safeReceived - total));
  const selectedCustomer = customers.find((customer) => customer.id === cart.customerId);
  const visibleCustomers = customers.filter((customer) => `${customer.name} ${customer.phone || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  function updateQuantity(index, line, delta) {
    const quantity = Math.max(1, lineQuantity(line) + delta);
    cart.updateLine(index, recalculate(line, quantity));
  }

  function selectMethod(next) {
    setMethod(next);
    setReceivedInput(next === 'CREDIT' ? '0' : String(total));
    setError(null);
  }

  function complete() {
    if (busy) return;
    if (!cart.lines.length) return setError(t('billing.addAtLeastOneProduct'));
    if (discount > subtotal) return setError(t('billing.payment.discountTooLarge'));
    if (!Number.isFinite(received) || received < 0) return setError(t('billing.payment.invalidAmount'));
    if (remainingDue > 0 && !cart.customerId) return setError(t('billing.payment.customerRequired'));
    setBusy(true);
    setError(null);
    createBill.mutate({
      customerId: cart.customerId,
      customerName: selectedCustomer?.name || cart.customerName || t('billing.payment.walkIn'),
      customerPhone: selectedCustomer?.phone || cart.customerPhone,
      subtotal,
      discount,
      totalAmount: total,
      totalReceived: safeReceived,
      changeDue,
      remainingDue,
      paymentMethod: method,
      status: remainingDue > 0 ? 'PENDING' : 'PAID',
      items: cart.lines,
    }, {
      onSuccess: (bill) => {
        cart.reset();
        setBusy(false);
        navigation.replace('BillDetail', { billId: bill.id });
      },
      onError: (cause) => {
        setBusy(false);
        setError(cause?.message || t('billing.payment.failed'));
      },
    });
  }

  const summaryRow = (label, value, accent) => <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.md }}><Text style={[typography.body, { flex: 1, color: colors.ink.secondary, textAlign: align }]}>{label}</Text><Text style={[typography.bodyMedium, { color: accent || colors.ink.primary }]}>{value}</Text></View>;

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('billing.checkoutTitle')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{t('billing.cartItems')} · {cart.lines.length}</Text>
          <Card style={{ padding: 0, overflow: 'hidden' }} level="none">
            {cart.lines.map((line, index) => (
              <View key={`${line.productId}-${index}`} style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: index === cart.lines.length - 1 ? 0 : 1, borderBottomColor: colors.surface.border }}>
                <View style={{ flex: 1 }}><Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{line.productName}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{formatCurrency(line.total)}</Text></View>
                <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs }}>
                  <MiniStep icon={Minus} onPress={() => updateQuantity(index, line, -1)} colors={colors} radii={radii} />
                  <Text style={[typography.label, { minWidth: 24, textAlign: 'center', color: colors.ink.primary }]}>{lineQuantity(line)}</Text>
                  <MiniStep icon={Plus} onPress={() => updateQuantity(index, line, 1)} colors={colors} radii={radii} />
                </View>
                <IconButton icon={Trash2} onPress={() => cart.removeLine(index)} size={15} tone="danger" style={{ width: 32, height: 32 }} />
              </View>
            ))}
          </Card>

          <Card style={{ gap: spacing.md }}>
            {summaryRow(t('billing.subtotal'), formatCurrency(subtotal))}
            <View style={{ flexDirection: direction, gap: spacing.sm }}>
              <View style={{ flex: 1 }}><Text style={[typography.label, { color: colors.ink.primary, marginBottom: spacing.xs, textAlign: align }]}>{t('billing.discount')}</Text><View style={{ flexDirection: direction, gap: spacing.xs, marginBottom: spacing.xs }}><Chip label={t('billing.fixed')} selected={cart.discountType === 'fixed'} onPress={() => cart.setDiscountType('fixed')} /><Chip label="%" selected={cart.discountType === 'percent'} onPress={() => cart.setDiscountType('percent')} /></View><TextField value={String(cart.overallDiscount || '')} onChangeText={(value) => cart.setOverallDiscount(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0" /></View>
              <TextField style={{ flex: 1 }} label={t('billing.taxPercent')} value={String(cart.taxPercent || '')} onChangeText={(value) => cart.setTaxPercent(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0" />
            </View>
            {discount > 0 ? summaryRow(t('billing.discount'), `- ${formatCurrency(discount)}`, colors.semantic.success) : null}
            {taxAmount > 0 ? summaryRow(`${t('billing.tax')} (${taxPercent}%)`, `+ ${formatCurrency(taxAmount)}`) : null}
            <View style={{ height: 1, backgroundColor: colors.surface.border }} />
            <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{t('billing.grandTotal')}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.itemsCount').replace('{count}', cart.lines.length)}</Text></View><Text style={[typography.numericLarge, { color: colors.brand.primary, fontSize: 28 }]}>{formatCurrency(total)}</Text></View>
          </Card>

          <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{t('billing.payment.methodLabel')}</Text>
          <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: spacing.sm }}>
            {methods.map((option) => { const Icon = option.icon; const active = method === option.key; return <Pressable key={option.key} onPress={() => selectMethod(option.key)} style={{ width: '48%', minHeight: 70, backgroundColor: active ? colors.semantic.successBg : colors.surface.raised, borderWidth: active ? 1.5 : 1, borderColor: active ? colors.brand.primary : colors.surface.border, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}><Icon size={20} color={active ? colors.brand.primary : colors.ink.secondary} /><Text style={[typography.label, { color: active ? colors.brand.primary : colors.ink.primary }]}>{t(option.label)}</Text></Pressable>; })}
          </View>
          <Pressable onPress={() => setCustomerOpen(true)} style={{ backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.md, flexDirection: direction, alignItems: 'center', justifyContent: 'space-between' }}><Text style={[typography.body, { color: colors.ink.primary }]}>{selectedCustomer?.name || t('billing.payment.selectCustomer')}</Text>{selectedCustomer ? <Check size={17} color={colors.brand.primary} /> : null}</Pressable>
          <TextField label={t('billing.amountReceived')} value={method === 'CREDIT' ? '0' : String(receivedInput == null ? total : receivedInput)} onChangeText={setReceivedInput} keyboardType="decimal-pad" editable={method !== 'CREDIT'} />
          {changeDue > 0 ? summaryRow(t('billing.payment.change'), formatCurrency(changeDue), colors.semantic.success) : null}
          {remainingDue > 0 ? summaryRow(t('billing.remainingDue'), formatCurrency(remainingDue), colors.semantic.warning) : null}
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}
        </ScrollView>
        <View style={{ padding: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surface.border }}><Button title={t('billing.completeBill')} onPress={complete} loading={busy} /></View>
      </SafeAreaView>
      <Sheet visible={customerOpen} onClose={() => setCustomerOpen(false)} title={t('billing.payment.selectCustomer')}>
        <TextField value={search} onChangeText={setSearch} placeholder={t('billing.creditCustomers.searchPlaceholder')} />
        {visibleCustomers.map((customer) => <Pressable key={customer.id} onPress={() => { cart.setCustomer({ customerId: customer.id, customerName: customer.name, customerPhone: customer.phone }); setCustomerOpen(false); }} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}><Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{customer.name}</Text>{customer.phone ? <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{customer.phone}</Text> : null}</Pressable>)}
        <Button title={t('billing.creditCustomers.addCustomer')} variant="outline" onPress={() => { setCustomerOpen(false); navigation.navigate('CreditCustomers'); }} style={{ marginTop: spacing.md }} />
      </Sheet>
    </AnimatedScreen>
  );
}

function MiniStep({ icon: Icon, onPress, colors, radii }) {
  return <Pressable onPress={onPress} style={{ width: 28, height: 28, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.surface.border, alignItems: 'center', justifyContent: 'center' }}><Icon size={13} color={colors.ink.primary} /></Pressable>;
}
