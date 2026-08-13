import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../theme';
import { useBill } from '../../hooks/useBills';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';
import { buildReceiptHtml } from '../../utils/receiptHtml';

export default function BillDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: bill } = useBill(route.params?.billId);
  const { data: shops = [] } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const shopName = shops.find((s) => String(s.id) === String(activeShopId))?.name;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Text style={[typography.h3, { color: colors.ink.primary }]}>Bill #{bill.serverId || bill.id.slice(0, 6)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.lg, padding: spacing.lg }}>
            <View style={{ alignItems: 'center' }}>
              <Logo size={30} color={colors.brand.primary} accentColor={colors.brand.accentLight} />
              <Text style={[typography.h3, { color: colors.ink.primary, marginTop: spacing.xs }]}>{shopName || 'AsaanKhata'}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {new Date(bill.createdAt).toLocaleString()} · #{bill.serverId || bill.id.slice(0, 6)}
              </Text>
            </View>

            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, borderStyle: 'dashed', gap: spacing.sm }}>
              {(bill.items || []).map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.caption, { color: colors.ink.primary }]}>
                    {item.productName} × {item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? ''}
                  </Text>
                  <Text style={[typography.caption, { color: colors.ink.primary }]}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surface.border, borderStyle: 'dashed', gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>Subtotal</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(bill.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.h3, { color: colors.ink.primary }]}>Total</Text>
                <Text style={[typography.h3, { color: colors.ink.primary }]}>{formatCurrency(bill.totalAmount)}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'center', marginTop: spacing.md }}>
              <Badge
                label={bill.status === 'PAID' ? 'PAID' : `PENDING · ${formatCurrency(bill.remainingDue)} DUE`}
                tone={bill.status === 'PAID' ? 'success' : 'warning'}
              />
            </View>
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg }}>
          <Button title="Print" variant="outline" onPress={handlePrint} style={{ flex: 1 }} />
          <Button title="Share" onPress={handleShare} style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
