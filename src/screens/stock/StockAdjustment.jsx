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
import { useT, useIsUrdu } from '../../store/languageStore';

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
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

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
      setError(t('stock.adjustment.errorQuantity'));
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
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16" style={isUrdu ? { transform: [{ scaleX: -1 }] } : undefined}>
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('stock.adjustment.title')}</Text>
        </View>

        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.surface.border }} />
          <View>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{product.name}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('stock.adjustment.currentStockLabel').replace('{stock}', formatStockLabel(product))}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
            {[
              { key: 'IN', label: t('stock.overview.filterStockIn') },
              { key: 'OUT', label: t('stock.overview.filterStockOut') },
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
                  <Text style={[typography.label, { color: selected ? colors.ink.onBrand : colors.ink.secondary }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs, textAlign }]}>{t('stock.adjustment.quantity')}</Text>
            <View
              style={{
                height: 46,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.surface.border,
                flexDirection: rowDirection,
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
                style={[typography.h3, { flex: 1, color: colors.ink.primary, paddingVertical: 0, textAlign }]}
              />
              <Text style={[typography.caption, { color: colors.ink.secondary, marginLeft: spacing.sm }]}>{t('stock.adjustment.newValue').replace('{value}', round(preview))}</Text>
            </View>
          </View>

          <TextField label={t('stock.adjustment.reason')} value={reason} onChangeText={setReason} placeholder="Purchase from supplier" style={{ textAlign }} />
          <TextField label={t('stock.adjustment.noteOptional')} value={note} onChangeText={setNote} placeholder="Invoice #4471, MediCorp Distributors" style={{ textAlign }} />

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{error}</Text> : null}
        </View>

        <View style={{ padding: spacing.lg, marginTop: 'auto' }}>
          <Button title={t('stock.adjustment.saveAdjustment')} onPress={handleSave} loading={adjustStock.isPending} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function round(n) {
  return Math.round(n * 10) / 10;
}
