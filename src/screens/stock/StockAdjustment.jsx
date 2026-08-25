import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useProduct, useAdjustStock } from '../../hooks/useProducts';
import { formatStockLabel } from '../../utils/stock';

function currentStockValue(product) {
  if (!product) return 0;
  switch (product.stockType) {
    case 'AREA':
      return product.stockAreaCm2 || 0;
    case 'LENGTH':
      return product.stockLengthCm || 0;
    case 'PACK':
      return product.stockPacks || 0;
    default:
      return product.stockQuantity || 0;
  }
}

export default function StockAdjustment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: product } = useProduct(route.params?.productId);
  const adjustStock = useAdjustStock();

  const [direction, setDirection] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  const qtyNum = parseFloat(quantity) || 0;
  const current = currentStockValue(product);
  const preview = direction === 'IN' ? current + qtyNum : Math.max(0, current - qtyNum);

  function handleSave() {
    if (!product || qtyNum <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    setError(null);
    adjustStock.mutate(
      { productId: product.id, type: direction, quantity: qtyNum, description: [reason, note].filter(Boolean).join(' — ') || undefined },
      { onSuccess: () => navigation.goBack() }
    );
  }

  if (!product) return null;

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>Adjust Stock</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.surface.border }} />
          <View>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{product.name}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Current stock: {formatStockLabel(product)}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { key: 'IN', label: 'Stock In' },
              { key: 'OUT', label: 'Stock Out' },
            ].map((opt) => {
              const selected = direction === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setDirection(opt.key)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: selected ? colors.brand.primary : 'transparent',
                    borderWidth: selected ? 0 : 1,
                    borderColor: colors.surface.border,
                  }}
                >
                  <Text style={[typography.label, { color: selected ? '#FAF9F6' : colors.ink.secondary }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs }]}>Quantity</Text>
            <View
              style={{
                height: 46,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.surface.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.md,
              }}
            >
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={colors.ink.secondary}
                keyboardType="numeric"
                style={[typography.h3, { flex: 1, color: colors.ink.primary, paddingVertical: 0 }]}
              />
              <Text style={[typography.caption, { color: colors.ink.secondary, marginLeft: spacing.sm }]}>New: {round(preview)}</Text>
            </View>
          </View>

          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="Purchase from supplier" />
          <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="Invoice #4471, MediCorp Distributors" />

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
        </View>

        <View style={{ padding: spacing.lg, marginTop: 'auto' }}>
          <Button title="Save Adjustment" onPress={handleSave} loading={adjustStock.isPending} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function round(n) {
  return Math.round(n * 10) / 10;
}
