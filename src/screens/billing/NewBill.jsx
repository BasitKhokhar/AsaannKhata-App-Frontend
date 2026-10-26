import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus, Minus, Trash2, PackagePlus, ReceiptText } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { Sheet } from '../../components/ui/Sheet';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/money';
import { useT, useIsUrdu } from '../../store/languageStore';

function defaultLineFor(product) {
  switch (product.stockType) {
    case 'AREA': {
      const totalArea = product.sheetAreaCm2 || 0;
      return {
        productId: product.id,
        productName: product.name,
        stockType: 'AREA',
        quantity: 1,
        unitArea: product.sheetAreaCm2,
        totalArea,
        pricePerUnit: product.salePrice,
        total: round2(totalArea * product.salePrice),
      };
    }
    case 'LENGTH': {
      const lengthCm = 100;
      return { productId: product.id, productName: product.name, stockType: 'LENGTH', lengthCm, pricePerUnit: product.salePrice, total: round2(lengthCm * product.salePrice) };
    }
    case 'PACK': {
      const pricePerUnit = product.packSalePrice ?? product.salePrice * (product.packSize || 1);
      return { productId: product.id, productName: product.name, stockType: 'PACK', packQuantity: 1, looseQuantity: 0, pricePerUnit, total: round2(pricePerUnit) };
    }
    default:
      return { productId: product.id, productName: product.name, stockType: 'QUANTITY', quantity: 1, pricePerUnit: product.salePrice, total: round2(product.salePrice) };
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Sheet renders a plain (non-scrolling) body when scrollable={false}, which
// is what we want here so the FlatList owns scrolling itself rather than
// nesting inside Sheet's ScrollView. FlatList still needs a bounded height
// to know when to start scrolling, so we cap it explicitly instead of
// relying on flex propagation through the non-flex ancestors in Sheet.
const PICKER_LIST_MAX_HEIGHT = Dimensions.get('window').height * 0.55;

export default function NewBill() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState(null);

  const { data: searchResults = [] } = useProducts({ search });
  const cart = useCartStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const subtotal = cart.subtotal();
  const total = Math.max(0, subtotal - (parseFloat(cart.overallDiscount) || 0));

  function addProduct(product) {
    cart.addLine(defaultLineFor(product));
    setPickerOpen(false);
    setSearch('');
  }

  function updateQty(index, line, delta) {
    if (line.stockType === 'QUANTITY') {
      const quantity = Math.max(1, (line.quantity || 1) + delta);
      cart.updateLine(index, { quantity, total: round2(quantity * line.pricePerUnit) });
    } else if (line.stockType === 'PACK') {
      const packQuantity = Math.max(1, (line.packQuantity || 1) + delta);
      cart.updateLine(index, { packQuantity, total: round2(packQuantity * line.pricePerUnit) });
    }
  }

  function handleContinue() {
    if (cart.lines.length === 0) {
      setError(t('billing.addAtLeastOneProduct'));
      return;
    }
    setError(null);
    navigation.navigate('Payment');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs }}>
          <Text style={[typography.h3, { color: colors.ink.primary, textAlign }]}>{t('billing.newBill')}</Text>
          <Pressable onPress={() => navigation.navigate('Records')} accessibilityRole="button" style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.xs, padding: spacing.xs }}>
            <ReceiptText size={17} color={colors.brand.primary} />
            <Text style={[typography.label, { color: colors.brand.primary }]}>{t('nav.records')}</Text>
          </Pressable>
        </View>
        <SubscriptionBanner />

        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[
            {
              marginHorizontal: spacing.lg,
              marginTop: spacing.sm,
              marginBottom: spacing.sm,
              height: 44,
              borderRadius: radii.md,
              backgroundColor: colors.surface.card,
              borderWidth: 1,
              borderColor: colors.surface.border,
              flexDirection: rowDirection,
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            },
            elevation.xs,
          ]}
        >
          <Search size={16} color={colors.ink.secondary} strokeWidth={1.8} />
          <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.addProductToCart')}</Text>
        </Pressable>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm }}>
          {cart.lines.map((line, index) => (
            <View
              key={`${line.productId}-${index}`}
              style={[
                { backgroundColor: colors.surface.card, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.md },
                elevation.xs,
              ]}
            >
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between' }}>
                <Text style={[typography.bodyMedium, { color: colors.ink.primary, flex: 1 }]} numberOfLines={1}>{line.productName}</Text>
                <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(line.total)}</Text>
              </View>
              <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                {line.stockType === 'QUANTITY' || line.stockType === 'PACK' ? (
                  <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
                    <Stepper onPress={() => updateQty(index, line, -1)} icon={Minus} colors={colors} radii={radii} />
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary, minWidth: 20, textAlign: 'center' }]}>
                      {line.stockType === 'PACK' ? line.packQuantity : line.quantity}
                    </Text>
                    <Stepper onPress={() => updateQty(index, line, 1)} icon={Plus} colors={colors} radii={radii} />
                  </View>
                ) : (
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                    {line.stockType === 'AREA' ? `${(line.totalArea / 929.03).toFixed(1)} ft²` : `${(line.lengthCm / 100).toFixed(1)} m`} @ {formatCurrency(line.pricePerUnit)}
                  </Text>
                )}
                <IconButton icon={Trash2} onPress={() => cart.removeLine(index)} size={16} tone="danger" style={{ width: 32, height: 32 }} />
              </View>
            </View>
          ))}

          {cart.lines.length > 0 && (
            <View
              style={[
                {
                  marginTop: spacing.sm,
                  backgroundColor: colors.surface.card,
                  borderWidth: 1,
                  borderColor: colors.surface.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  gap: spacing.xs,
                },
                elevation.xs,
              ]}
            >
              <Row label={t('billing.subtotal')} value={formatCurrency(subtotal)} colors={colors} typography={typography} rowDirection={rowDirection} />
              <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.overallDiscount')}</Text>
                <TextInput
                  value={String(cart.overallDiscount || '')}
                  onChangeText={(v) => cart.setOverallDiscount(parseFloat(v) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.ink.secondary}
                  style={[typography.body, { color: colors.ink.primary, width: 80, textAlign: 'right' }]}
                />
              </View>
              <View style={{ height: 1, backgroundColor: colors.surface.border, marginVertical: spacing.xs }} />
              <Row label={t('billing.total')} value={formatCurrency(total)} colors={colors} typography={typography} bold rowDirection={rowDirection} />

            </View>
          )}

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.sm, textAlign }]}>{error}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button title={t('billing.paymentContinue')} onPress={handleContinue} />
        </View>
      </SafeAreaView>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title={t('billing.addProduct')} scrollable={false}>
        <View style={{ padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md }}>
          <View
            style={{
              height: 44,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.surface.border,
              backgroundColor: colors.surface.bg,
              flexDirection: rowDirection,
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Search size={16} color={colors.ink.secondary} strokeWidth={1.8} />
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder={t('billing.searchProducts')}
              placeholderTextColor={colors.ink.secondary}
              style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign }]}
            />
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: PICKER_LIST_MAX_HEIGHT }}
            contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.lg }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm }}>
                <PackagePlus size={28} color={colors.ink.secondary} strokeWidth={1.6} />
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('billing.noProductsFound')}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => addProduct(item)}
                style={{
                  flexDirection: rowDirection,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: colors.surface.card,
                }}
              >
                <Text style={[typography.body, { color: colors.ink.primary, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(item.salePrice)}</Text>
              </Pressable>
            )}
          />
        </View>
      </Sheet>
    </AnimatedScreen>
  );
}

function Stepper({ onPress, icon: Icon, colors, radii }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 26,
        height: 26,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: colors.surface.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={13} color={colors.ink.primary} strokeWidth={2} />
    </Pressable>
  );
}

function Row({ label, value, colors, typography, bold, rowDirection }) {
  return (
    <View style={{ flexDirection: rowDirection || 'row', justifyContent: 'space-between' }}>
      <Text style={[bold ? typography.h3 : typography.body, { color: bold ? colors.ink.primary : colors.ink.secondary }]}>{label}</Text>
      <Text style={[bold ? typography.h3 : typography.body, { color: colors.ink.primary }]}>{value}</Text>
    </View>
  );
}
