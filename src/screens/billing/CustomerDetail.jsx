import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Receipt, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { Sheet } from '../../components/ui/Sheet';
import { useTheme } from '../../theme';
import { useCustomer, useRecordCustomerPayment } from '../../hooks/useCustomers';
import { billRepository } from '../../db/repositories/billRepository';
import { customerPaymentRepository } from '../../db/repositories/customerPaymentRepository';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function CustomerDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const customerId = route.params?.customerId;
  const { data: customer } = useCustomer(customerId);
  const recordPayment = useRecordCustomerPayment();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  if (!customer) return null;

  const bills = billRepository.listByCustomer(customerId);
  const payments = customerPaymentRepository.listByShop(customer.shopId).filter((p) => p.customerId === customerId);
  const history = [
    ...bills.map((b) => ({ kind: 'bill', at: b.createdAt, ...b })),
    ...payments.map((p) => ({ kind: 'payment', at: p.createdAt, ...p })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  function handleRecordPayment() {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    recordPayment.mutate(
      { customerId, amount: amt },
      {
        onSuccess: () => {
          setPayOpen(false);
          setAmount('');
          showToast(t('billing.customerDetail.paymentRecorded').replace('{amount}', formatCurrency(amt)), 'success');
        },
      }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={customer.name} onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Card style={{ alignItems: 'center' }}>
            <LinearGradient colors={colors.gradient.primary} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.ink.onBrand, fontSize: 20, fontWeight: '700' }}>{customer.name?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.sm }]}>{formatCurrency(customer.balance)}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>
              {customer.balance > 0 ? t('billing.customerDetail.outstandingBalance') : t('billing.customerDetail.allSettledUp')}
            </Text>
            {customer.phone ? <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 4 }]}>{customer.phone}</Text> : null}
          </Card>

          <Button title={t('billing.customerDetail.recordPayment')} variant="accent" onPress={() => setPayOpen(true)} />

          <Text style={[typography.h3, { color: colors.ink.primary, textAlign }]}>{t('billing.customerDetail.history')}</Text>
          {history.length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('billing.customerDetail.noActivity')}</Text>
          ) : (
            history.map((entry) => (
              <Pressable
                key={`${entry.kind}-${entry.id}`}
                onPress={() => entry.kind === 'bill' && navigation.navigate('BillDetail', { billId: entry.id })}
                style={[
                  {
                    flexDirection: rowDirection,
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.surface.card,
                    borderRadius: radii.md,
                    padding: spacing.md,
                  },
                  elevation.xs,
                ]}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radii.md,
                    backgroundColor: (entry.kind === 'bill' ? colors.brand.primary : colors.semantic.success) + '1F',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {entry.kind === 'bill' ? (
                    <Receipt size={16} color={colors.brand.primary} strokeWidth={1.8} />
                  ) : (
                    <Wallet size={16} color={colors.semantic.success} strokeWidth={1.8} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.ink.primary }]}>
                    {entry.kind === 'bill' ? t('billing.customerDetail.billAmount').replace('{amount}', formatCurrency(entry.totalAmount)) : t('billing.customerDetail.paymentReceived')}
                  </Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatRelativeTime(entry.at)}</Text>
                </View>
                {entry.kind === 'bill' ? (
                  <Badge label={entry.status === 'PAID' ? t('dashboard.paid') : t('dashboard.pending')} tone={entry.status === 'PAID' ? 'success' : 'warning'} />
                ) : (
                  <Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>-{formatCurrency(entry.amount)}</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Sheet
        visible={payOpen}
        onClose={() => setPayOpen(false)}
        title={t('billing.customerDetail.recordPayment')}
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button title={t('billing.customerDetail.savePayment')} onPress={handleRecordPayment} loading={recordPayment.isPending} />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setPayOpen(false)} />
          </View>
        }
      >
        <TextField label={t('billing.customerDetail.amount')} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" style={{ textAlign }} />
      </Sheet>
    </AnimatedScreen>
  );
}
