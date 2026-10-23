import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Banknote, CreditCard, Smartphone, HandCoins, Check } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Sheet } from '../../components/ui/Sheet';
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

export default function Payment() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
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
  const discount = Math.max(0, Number(cart.overallDiscount) || 0);
  const total = round2(Math.max(0, subtotal - discount));
  const received = method === 'CREDIT' ? 0 : Number(receivedInput == null ? total : receivedInput);
  const safeReceived = Number.isFinite(received) ? received : 0;
  const remainingDue = round2(Math.max(0, total - safeReceived));
  const changeDue = round2(Math.max(0, safeReceived - total));
  const selectedCustomer = customers.find((customer) => customer.id === cart.customerId);
  const visibleCustomers = customers.filter((customer) => `${customer.name} ${customer.phone || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  function selectMethod(next) {
    setMethod(next);
    setReceivedInput(next === 'CREDIT' ? '0' : String(total));
    setError(null);
  }

  function complete() {
    if (busy) return;
    if (!cart.lines.length) {
      setError(t('billing.addAtLeastOneProduct'));
      return;
    }
    if (discount > subtotal) {
      setError(t('billing.payment.discountTooLarge'));
      return;
    }
    if (!Number.isFinite(received) || received < 0) {
      setError(t('billing.payment.invalidAmount'));
      return;
    }
    if (remainingDue > 0 && !cart.customerId) {
      setError(t('billing.payment.customerRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    createBill.mutate({
      customerId: cart.customerId,
      customerName: selectedCustomer?.name || cart.customerName || t('billing.payment.walkIn'),
      customerPhone: selectedCustomer?.phone || cart.customerPhone,
      subtotal, discount, totalAmount: total, totalReceived: received,
      changeDue, remainingDue, paymentMethod: method,
      status: remainingDue > 0 ? 'PENDING' : 'PAID',
      items: cart.lines,
    }, {
      onSuccess: (bill) => {
        cart.reset();
        setBusy(false);
        navigation.replace('BillDetail', { billId: bill.id });
      },
      onError: (billError) => {
        setBusy(false);
        setError(billError?.message || t('billing.payment.failed'));
      },
    });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('billing.payment.title')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <Card level="none" style={{ gap: spacing.xs }}>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('billing.payment.totalAmount')}</Text>
            <Text style={[typography.numericLarge, { color: colors.ink.primary, fontSize: 28 }]}>{formatCurrency(total)}</Text>
          </Card>
          <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {methods.map((option) => {
              const Icon = option.icon;
              const selected = method === option.key;
              return (
                <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => selectMethod(option.key)} style={{ width: '48%', minHeight: 82, backgroundColor: selected ? colors.semantic.successBg : colors.surface.raised, borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.brand.primary : colors.surface.border, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
                  <Icon size={21} color={selected ? colors.brand.primary : colors.ink.secondary} strokeWidth={1.8} />
                  <Text style={[typography.label, { color: selected ? colors.brand.primary : colors.ink.primary }]}>{t(option.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          {method === 'CARD' || method === 'MOBILE_WALLET' ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('billing.payment.externalNote')}</Text> : null}
          <TextField label={t('billing.amountReceived')} value={method === 'CREDIT' ? '0' : String(receivedInput == null ? total : receivedInput)} onChangeText={setReceivedInput} keyboardType="decimal-pad" editable={method !== 'CREDIT'} />
          <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.payment.change')}</Text>
            <Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>{formatCurrency(changeDue)}</Text>
          </View>
          {remainingDue > 0 ? <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', justifyContent: 'space-between' }}><Text style={[typography.body, { color: colors.semantic.warning }]}>{t('billing.remainingDue')}</Text><Text style={[typography.bodyMedium, { color: colors.semantic.warning }]}>{formatCurrency(remainingDue)}</Text></View> : null}
          <Pressable onPress={() => setCustomerOpen(true)} style={{ backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.md, flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.body, { color: colors.ink.primary }]}>{selectedCustomer?.name || t('billing.payment.selectCustomer')}</Text>
            {selectedCustomer ? <Check size={17} color={colors.brand.primary} /> : null}
          </Pressable>
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
        </ScrollView>
        <View style={{ padding: spacing.lg }}><Button title={t('billing.payment.complete')} onPress={complete} loading={busy} /></View>
      </SafeAreaView>
      <Sheet visible={customerOpen} onClose={() => setCustomerOpen(false)} title={t('billing.payment.selectCustomer')}>
        <TextField value={search} onChangeText={setSearch} placeholder={t('billing.creditCustomers.searchPlaceholder')} />
        {visibleCustomers.map((customer) => (
          <Pressable key={customer.id} onPress={() => { cart.setCustomer({ customerId: customer.id, customerName: customer.name, customerPhone: customer.phone }); setCustomerOpen(false); }} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{customer.name}</Text>
            {customer.phone ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>{customer.phone}</Text> : null}
          </Pressable>
        ))}
        <Button title={t('billing.creditCustomers.addCustomer')} variant="outline" onPress={() => { setCustomerOpen(false); navigation.navigate('CreditCustomers'); }} style={{ marginTop: spacing.md }} />
      </Sheet>
    </AnimatedScreen>
  );
}
