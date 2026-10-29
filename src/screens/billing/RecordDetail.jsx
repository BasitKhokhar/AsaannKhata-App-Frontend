import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CalendarDays, Phone, ReceiptText, UserRound, Wallet } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useBill } from '../../hooks/useBills';
import { paymentTime } from '../../db/repositories/billSettlementRepository';
import { formatCurrency } from '../../utils/money';
import { paymentMethodLabelKey } from '../../utils/paymentMethod';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RecordDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { data: bill } = useBill(route.params?.billId);

  if (!bill) return null;
  const checkoutPaid = Math.max(0, bill.totalReceived - bill.payments.reduce((sum, payment) => sum + payment.amount, 0));
  const taxAmount = Math.max(0, Number(bill.totalAmount) - (Number(bill.subtotal) - Number(bill.discount)));
  const row = (label, value, color) => (
    <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={[typography.body, { flex: 1, color: colors.ink.onBrand, opacity: 0.72, textAlign: align }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: color || colors.ink.primary }]}>{value}</Text>
    </View>
  );

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('records.details')} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
          <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptText size={23} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h2, { color: colors.ink.primary, textAlign: align }]}>#{bill.serverId || bill.id.slice(0, 8)}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{new Date(bill.createdAt).toLocaleString()}</Text>
            </View>
            <Badge label={t(`records.${bill.status.toLowerCase()}`)} tone={bill.status === 'PAID' ? 'success' : 'warning'} />
          </View>

          <Card style={{ gap: spacing.md }}>
            <Info icon={UserRound} label={t('records.customer')} value={bill.customerName} direction={direction} align={align} theme={{ colors, typography, spacing }} />
            {bill.customerPhone ? <Info icon={Phone} label={t('records.phone')} value={bill.customerPhone} direction={direction} align={align} theme={{ colors, typography, spacing }} /> : null}
            <Info icon={CalendarDays} label={t('records.date')} value={new Date(bill.createdAt).toLocaleString()} direction={direction} align={align} theme={{ colors, typography, spacing }} />
          </Card>

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, textAlign: align, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>{t('records.items')}</Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {(bill.items || []).map((item, index) => (
                <View key={item.id} style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: index ? 1 : 0, borderTopColor: colors.surface.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{item.productName}</Text>
                    <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? 0}</Text>
                  </View>
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </Card>
          </View>

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, textAlign: align, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>{t('records.paymentHistory')}</Text>
            <Card style={{ gap: 0 }}>
              {checkoutPaid > 0 ? <PaymentRow label={t('records.atCheckout')} date={bill.createdAt} amount={checkoutPaid} direction={direction} align={align} theme={{ colors, typography, spacing }} /> : null}
              {bill.payments.map((payment) => <PaymentRow key={payment.id} label={t('records.addPayment')} date={paymentTime(payment)} amount={payment.amount} direction={direction} align={align} theme={{ colors, typography, spacing }} />)}
              {bill.totalReceived <= 0 ? <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('records.noPayments')}</Text> : null}
            </Card>
          </View>

          <View style={{ backgroundColor: colors.brand.primaryDark, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm }}>
            {row(t('billing.subtotal'), formatCurrency(bill.subtotal), colors.ink.onBrand)}
            {bill.discount > 0 ? row(t('billing.discount'), `- ${formatCurrency(bill.discount)}`, colors.ink.onBrand) : null}
            {taxAmount > 0.005 ? row(t('billing.tax'), `+ ${formatCurrency(taxAmount)}`, colors.ink.onBrand) : null}
            {row(t('billing.payment.methodLabel'), t(paymentMethodLabelKey(bill.paymentMethod)), colors.ink.onBrand)}
            <View style={{ height: 1, backgroundColor: colors.ink.onBrand, opacity: 0.2 }} />
            {row(t('billing.total'), formatCurrency(bill.totalAmount), colors.ink.onBrand)}
            {row(t('records.paidAmount'), formatCurrency(Math.min(bill.totalAmount, bill.totalReceived)), colors.semantic.success)}
            {row(t('billing.remainingDue'), formatCurrency(bill.remainingDue), bill.remainingDue ? colors.semantic.warning : colors.semantic.success)}
          </View>

          {bill.remainingDue > 0 && bill.customerId ? <Button title={t('records.addPayment')} onPress={() => navigation.navigate('RecordPayment', { billId: bill.id })} /> : null}
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function Info({ icon: Icon, label, value, direction, align, theme }) {
  const { colors, typography, spacing } = theme;
  return <View style={{ flexDirection: direction, gap: spacing.sm }}><Icon size={17} color={colors.ink.secondary} /><View style={{ flex: 1 }}><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{label}</Text><Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{value}</Text></View></View>;
}

function PaymentRow({ label, date, amount, direction, align, theme }) {
  const { colors, typography, spacing } = theme;
  return <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}><Wallet size={16} color={colors.semantic.success} /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{label}</Text><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{new Date(date).toLocaleString()}</Text></View><Text style={[typography.bodyMedium, { color: colors.semantic.success }]}>{formatCurrency(amount)}</Text></View>;
}
