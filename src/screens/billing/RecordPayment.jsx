import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { useTheme } from '../../theme';
import { useBill, useRecordBillPayment } from '../../hooks/useBills';
import { formatCurrency } from '../../utils/money';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RecordPayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const align = isUrdu ? 'right' : 'left';
  const direction = isUrdu ? 'row-reverse' : 'row';
  const { data: bill } = useBill(route.params?.billId);
  const recordPayment = useRecordBillPayment();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const saving = useRef(false);

  if (!bill) return null;
  const summary = (label, value, color) => <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.md }}><Text style={[typography.body, { color: colors.ink.secondary, textAlign: align }]}>{label}</Text><Text style={[typography.bodyMedium, { color: color || colors.ink.primary }]}>{value}</Text></View>;
  function save() {
    if (saving.current) return;
    saving.current = true;
    recordPayment.mutate({ billId: bill.id, amount }, {
      onSuccess: () => { showToast(t('records.paymentSaved'), 'success'); navigation.replace('RecordDetail', { billId: bill.id }); },
      onError: (cause) => { saving.current = false; setError(cause.message?.startsWith('records.error.') ? t(cause.message) : t('records.paymentFailed')); },
    });
  }

  return <AnimatedScreen><SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}><Header title={t('records.addPayment')} onBack={() => navigation.goBack()} /><KeyboardAwareView><KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}><Text style={[typography.h2, { color: colors.ink.primary, textAlign: align }]}>{bill.customerName}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>#{bill.serverId || bill.id.slice(0, 8)}</Text><Card style={{ gap: spacing.md }}>{summary(t('billing.total'), formatCurrency(bill.totalAmount))}{summary(t('records.paidAmount'), formatCurrency(Math.min(bill.totalAmount, bill.totalReceived)), colors.semantic.success)}{summary(t('billing.remainingDue'), formatCurrency(bill.remainingDue), colors.semantic.warning)}</Card><TextField label={t('records.newAmount')} value={amount} onChangeText={(value) => { setAmount(value); setError(''); }} keyboardType="decimal-pad" placeholder="0" />{error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}</KeyboardAwareScrollView><View style={{ padding: spacing.lg }}><Button title={t('records.savePayment')} onPress={save} /></View></KeyboardAwareView></SafeAreaView></AnimatedScreen>;
}
