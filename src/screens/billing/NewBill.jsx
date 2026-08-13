import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { useTheme } from '../../theme';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useCreateBill } from '../../hooks/useBills';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/money';

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

export default function NewBill() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [error, setError] = useState(null);

  const { data: searchResults = [] } = useProducts({ search });
  const { data: customers = [] } = useCustomers();
  const createBill = useCreateBill();
  const cart = useCartStore();

  const subtotal = cart.subtotal();
  const total = Math.max(0, subtotal - (parseFloat(cart.overallDiscount) || 0));
  const received = parseFloat(amountReceived) || 0;
  const remainingDue = Math.max(0, round2(total - received));
  const changeDue = Math.max(0, round2(received - total));

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

  function handleComplete() {
    if (cart.lines.length === 0) {
      setError('Add at least one product to the cart.');
      return;
    }
    setError(null);

    createBill.mutate(
      {
        customerId: cart.customerId,
        customerName: cart.customerName || 'Walk-in Customer',
        customerPhone: cart.customerPhone,
        subtotal,
        discount: parseFloat(cart.overallDiscount) || 0,
        totalAmount: total,
        totalReceived: received,
        changeDue,
        remainingDue,
        status: remainingDue > 0 ? 'PENDING' : 'PAID',
        items: cart.lines,
      },
      {
        onSuccess: (bill) => {
          cart.reset();
          setAmountReceived('');
          navigation.navigate('BillDetail', { billId: bill.id });
        },
      }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm }}>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>New Bill</Text>
        </View>
        <SubscriptionBanner />

        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            height: 40,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.surface.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 16 16">
            <Circle cx={6.5} cy={6.5} r={4.5} fill="none" stroke={colors.ink.secondary} strokeWidth={1.4} />
            <Line x1={10} y1={10} x2={14} y2={14} stroke={colors.ink.secondary} strokeWidth={1.4} />
          </Svg>
          <Text style={[typography.caption, { color: colors.ink.secondary }]}>Add product to cart</Text>
        </Pressable>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {cart.lines.map((line, index) => (
            <View key={`${line.productId}-${index}`} style={{ borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{line.productName}</Text>
                <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(line.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                {line.stockType === 'QUANTITY' || line.stockType === 'PACK' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Stepper onPress={() => updateQty(index, line, -1)} label="−" colors={colors} radii={radii} />
                    <Text style={[typography.caption, { color: colors.ink.primary }]}>{line.stockType === 'PACK' ? line.packQuantity : line.quantity}</Text>
                    <Stepper onPress={() => updateQty(index, line, 1)} label="+" colors={colors} radii={radii} />
                  </View>
                ) : (
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                    {line.stockType === 'AREA' ? `${(line.totalArea / 929.03).toFixed(1)} ft²` : `${(line.lengthCm / 100).toFixed(1)} m`} @ {formatCurrency(line.pricePerUnit)}
                  </Text>
                )}
                <Pressable onPress={() => cart.removeLine(index)}>
                  <Text style={[typography.caption, { color: colors.semantic.danger }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {cart.lines.length > 0 && (
            <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.surface.border, borderStyle: 'dashed', gap: spacing.xs }}>
              <Row label="Subtotal" value={formatCurrency(subtotal)} colors={colors} typography={typography} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.body, { color: colors.ink.secondary }]}>Overall discount</Text>
                <TextInput
                  value={String(cart.overallDiscount || '')}
                  onChangeText={(v) => cart.setOverallDiscount(parseFloat(v) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  style={[typography.body, { color: colors.ink.primary, width: 80, textAlign: 'right' }]}
                />
              </View>
              <Row label="Total" value={formatCurrency(total)} colors={colors} typography={typography} bold />

              <View style={{ marginTop: spacing.sm }}>
                <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs }]}>Amount received</Text>
                <TextInput
                  value={amountReceived}
                  onChangeText={setAmountReceived}
                  keyboardType="numeric"
                  placeholder={String(total)}
                  placeholderTextColor={colors.ink.secondary}
                  style={{
                    height: 42,
                    borderRadius: radii.sm,
                    borderWidth: 1,
                    borderColor: colors.surface.border,
                    paddingHorizontal: spacing.md,
                    color: colors.ink.primary,
                  }}
                />
              </View>

              {remainingDue > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: colors.semantic.warningBg,
                    borderRadius: radii.sm,
                    padding: spacing.sm,
                    marginTop: spacing.xs,
                  }}
                >
                  <Text style={[typography.label, { color: colors.semantic.warning }]}>Remaining due (khata)</Text>
                  <Text style={[typography.bodyMedium, { color: colors.semantic.warning }]}>{formatCurrency(remainingDue)}</Text>
                </View>
              )}
            </View>
          )}

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button title="Complete Bill" variant="accent" onPress={handleComplete} loading={createBill.isPending} />
        </View>
      </SafeAreaView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.bg }}>
          <View style={{ padding: spacing.lg }}>
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder="Search products"
              placeholderTextColor={colors.ink.secondary}
              style={{
                height: 44,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.surface.border,
                paddingHorizontal: spacing.md,
                color: colors.ink.primary,
              }}
            />
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => addProduct(item)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}
              >
                <Text style={[typography.body, { color: colors.ink.primary }]}>{item.name}</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(item.salePrice)}</Text>
              </Pressable>
            )}
          />
          <View style={{ padding: spacing.lg }}>
            <Button title="Close" variant="outline" onPress={() => setPickerOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </AnimatedScreen>
  );
}

function Stepper({ onPress, label, colors, radii }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 22, height: 22, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.surface.border, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: colors.ink.primary }}>{label}</Text>
    </Pressable>
  );
}

function Row({ label, value, colors, typography, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[bold ? typography.h3 : typography.body, { color: bold ? colors.ink.primary : colors.ink.secondary }]}>{label}</Text>
      <Text style={[bold ? typography.h3 : typography.body, { color: colors.ink.primary }]}>{value}</Text>
    </View>
  );
}
