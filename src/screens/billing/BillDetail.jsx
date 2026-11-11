import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { useTheme } from '../../theme';
import { useBill } from '../../hooks/useBills';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';
import { ReceiptActions } from '../../components/ui/ReceiptActions';
import { paymentMethodLabelKey } from '../../utils/paymentMethod';
import { useT, useIsUrdu } from '../../store/languageStore';
import { adsService } from '../../services/adsService';

export default function BillDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const { data: bill } = useBill(route.params?.billId);
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const shopName = shops.find((s) => String(s.id) === String(activeShopId))?.name;
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const interstitialHandled = useRef(false);

  useEffect(() => {
    if (!route.params?.interstitialEligible) return undefined;
    adsService.preloadInterstitialAd();
    return navigation.addListener('beforeRemove', (event) => {
      if (interstitialHandled.current) return;
      event.preventDefault();
      interstitialHandled.current = true;
      adsService.showInterstitialThenContinue(() => navigation.dispatch(event.data.action));
    });
  }, [navigation, route.params?.interstitialEligible]);

  if (!bill) return <AnimatedScreen><Header title={t('records.details')} /></AnimatedScreen>;
  const taxAmount = Math.max(0, Number(bill.totalAmount) - (Number(bill.subtotal) - Number(bill.discount)));

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('billing.billDetail.title').replace('{id}', bill.serverId || bill.id.slice(0, 6))} />

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <View
            style={[
              { backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.lg, padding: spacing.lg },
              elevation.sm,
            ]}
          >
            <View style={{ alignItems: 'center' }}>
              <Logo size={30} color={colors.brand.primary} accentColor={colors.brand.accentLight} />
              <Text style={[typography.h3, { color: colors.ink.primary, marginTop: spacing.xs }]}>{shopName || 'AsaanKhata'}</Text>
              <Text style={[typography.label, { color: colors.brand.primary, marginTop: spacing.xs }]}>{t('receipt.title')}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {new Date(bill.createdAt).toLocaleString()} · #{bill.serverId || bill.id.slice(0, 6)}
              </Text>
            </View>

            <View style={{ marginTop: spacing.md, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface.raised }}>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('records.customer')}</Text>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{bill.customerName}</Text>
              {bill.customerPhone ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>{bill.customerPhone}</Text> : null}
            </View>

            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, borderStyle: 'dashed', gap: spacing.sm }}>
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}><Text style={[typography.label, { color: colors.ink.secondary }]}>{t('records.items')}</Text><Text style={[typography.label, { color: colors.ink.secondary }]}>{t('billing.total')}</Text></View>
              {(bill.items || []).map((item) => (
                <View key={item.id} style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { flex: 1, color: colors.ink.primary }]}>
                    {item.productName} × {item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? ''}
                  </Text>
                  <Text style={[typography.caption, { color: colors.ink.primary }]}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>

            <View
              style={[
                {
                  marginTop: spacing.md,
                  backgroundColor: colors.brand.primaryDark,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  gap: spacing.xs,
                },
                elevation.md,
              ]}
            >
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}>
                <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.7 }]}>{t('billing.subtotal')}</Text>
                <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.7 }]}>{formatCurrency(bill.subtotal)}</Text>
              </View>
              {bill.discount > 0 ? <View style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}><Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.7 }]}>{t('billing.discount')}</Text><Text style={[typography.caption, { color: colors.ink.onBrand }]}>- {formatCurrency(bill.discount)}</Text></View> : null}
              {taxAmount > 0.005 ? <View style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}><Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.7 }]}>{t('billing.tax')}</Text><Text style={[typography.caption, { color: colors.ink.onBrand }]}>+ {formatCurrency(taxAmount)}</Text></View> : null}
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', marginTop: spacing.xs }}>
                <Text style={[typography.h3, { color: colors.ink.onBrand }]}>{t('billing.total')}</Text>
                <Text style={[typography.h3, { color: colors.ink.onBrand }]}>{formatCurrency(bill.totalAmount)}</Text>
              </View>
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', marginTop: spacing.xs }}>
                <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.7 }]}>{t('billing.payment.methodLabel')}</Text>
                <Text style={[typography.caption, { color: colors.ink.onBrand }]}>{t(paymentMethodLabelKey(bill.paymentMethod))}</Text>
              </View>

              <View style={{ alignItems: 'center', marginTop: spacing.md }}>
                <Badge
                  label={bill.status === 'PAID' ? t('billing.billDetail.paid') : t('billing.billDetail.pendingDue').replace('{amount}', formatCurrency(bill.remainingDue))}
                  tone={bill.status === 'PAID' ? 'success' : 'warning'}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}><ReceiptActions bill={bill} /></View>
        <View style={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }}>
          <Button title={t('billing.billDetail.goToPos')} onPress={() => navigation.navigate('NewBill')} />
          <Button title={t('records.viewPaymentRecord')} variant="outline" onPress={() => navigation.navigate('Records', { screen: 'RecordDetail', params: { billId: bill.id } })} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
