import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import { buildReceiptHtml } from '../../utils/receiptHtml';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function BillDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing, elevation, palette } = useTheme();
  const { data: bill } = useBill(route.params?.billId);
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const shopName = shops.find((s) => String(s.id) === String(activeShopId))?.name;
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  if (!bill) return null;

  async function handlePrint() {
    await Print.printAsync({ html: buildReceiptHtml({ shopName, bill }) });
  }

  async function handleShare() {
    const { uri } = await Print.printToFileAsync({ html: buildReceiptHtml({ shopName, bill }) });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={t('billing.billDetail.title').replace('{id}', bill.serverId || bill.id.slice(0, 6))} onBack={() => navigation.goBack()} />

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
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {new Date(bill.createdAt).toLocaleString()} · #{bill.serverId || bill.id.slice(0, 6)}
              </Text>
            </View>

            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, borderStyle: 'dashed', gap: spacing.sm }}>
              {(bill.items || []).map((item) => (
                <View key={item.id} style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.ink.primary }]}>
                    {item.productName} × {item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? ''}
                  </Text>
                  <Text style={[typography.caption, { color: colors.ink.primary }]}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>

            {/* Signature premium touch: this summary block is a fixed-dark
               card (palette.navy900) in BOTH light and dark theme — deliberate
               contrast against the theme-aware receipt above it, not a
               theme-matching surface. Text uses ink.onBrand (fixed near-white)
               since it's painted on a permanently-dark surface. */}
            <View
              style={[
                {
                  marginTop: spacing.md,
                  backgroundColor: palette.navy900,
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
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', marginTop: spacing.xs }}>
                <Text style={[typography.h3, { color: colors.ink.onBrand }]}>{t('billing.total')}</Text>
                <Text style={[typography.h3, { color: colors.ink.onBrand }]}>{formatCurrency(bill.totalAmount)}</Text>
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

        <View style={{ flexDirection: rowDirection, gap: spacing.sm, padding: spacing.lg }}>
          <Button title={t('billing.billDetail.print')} variant="outline" onPress={handlePrint} style={{ flex: 1 }} />
          <Button title={t('billing.billDetail.share')} onPress={handleShare} style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
