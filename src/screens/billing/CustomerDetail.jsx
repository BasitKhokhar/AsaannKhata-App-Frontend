import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useCustomer, useRecordCustomerPayment } from '../../hooks/useCustomers';
import { billRepository } from '../../db/repositories/billRepository';
import { customerPaymentRepository } from '../../db/repositories/customerPaymentRepository';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';

export default function CustomerDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const customerId = route.params?.customerId;
  const { data: customer } = useCustomer(customerId);
  const recordPayment = useRecordCustomerPayment();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');

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
    recordPayment.mutate({ customerId, amount: amt }, { onSuccess: () => { setPayOpen(false); setAmount(''); } });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>{customer.name}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Card style={{ alignItems: 'center' }}>
            <LinearGradient colors={colors.gradient.primary} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FAF9F6', fontSize: 20, fontWeight: '700' }}>{customer.name?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.sm }]}>{formatCurrency(customer.balance)}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>{customer.balance > 0 ? 'Outstanding balance' : 'All settled up'}</Text>
            {customer.phone ? <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 4 }]}>{customer.phone}</Text> : null}
          </Card>

          <Button title="Record Payment" variant="accent" onPress={() => setPayOpen(true)} />

          <Text style={[typography.h3, { color: colors.ink.primary }]}>History</Text>
          {history.length === 0 ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>No activity yet.</Text>
          ) : (
            history.map((entry) => (
              <Pressable
                key={`${entry.kind}-${entry.id}`}
                onPress={() => entry.kind === 'bill' && navigation.navigate('BillDetail', { billId: entry.id })}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}
              >
                <View>
                  <Text style={[typography.body, { color: colors.ink.primary }]}>{entry.kind === 'bill' ? `Bill · ${formatCurrency(entry.totalAmount)}` : 'Payment received'}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatRelativeTime(entry.at)}</Text>
                </View>
                {entry.kind === 'bill' ? (
                  <Badge label={entry.status === 'PAID' ? 'Paid' : 'Pending'} tone={entry.status === 'PAID' ? 'success' : 'warning'} />
                ) : (
                  <Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>-{formatCurrency(entry.amount)}</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={payOpen} transparent animationType="fade" onRequestClose={() => setPayOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface.bg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, gap: spacing.md }}>
            <Text style={[typography.h2, { color: colors.ink.primary }]}>Record Payment</Text>
            <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
            <Button title="Save Payment" onPress={handleRecordPayment} loading={recordPayment.isPending} />
            <Button title="Cancel" variant="ghost" onPress={() => setPayOpen(false)} />
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}
