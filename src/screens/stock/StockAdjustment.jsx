import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { useTheme } from '../../theme';
import { useProduct, useAdjustStock } from '../../hooks/useProducts';
import { formatStockLabel } from '../../utils/stock';
import { useT, useIsUrdu } from '../../store/languageStore';
import { adsService } from '../../services/adsService';

function currentStockValue(product) {
  if (!product) return 0;
  switch (product.stockType) {
    case 'AREA':
      return product.stockAreaCm2 || 0;
    case 'LENGTH':
      return product.stockLengthCm || 0;
    case 'PACK':
      return product.stockPacks || 0;
    case 'LIQUID':
      return product.stockVolumeMl || 0;
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
  const [unit, setUnit] = useState('unit');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  React.useEffect(() => {
    adsService.preloadInterstitialAd();
  }, []);

  React.useEffect(() => {
    if (!product) return;
    setUnit(product.stockType === 'AREA' ? 'ft2' : product.stockType === 'LENGTH' ? 'meter' : product.stockType === 'LIQUID' ? 'liter' : product.stockType === 'PACK' ? 'pack' : 'unit');
  }, [product?.id]);

  const qtyNum = parseFloat(quantity) || 0;
  const unitOptions = adjustmentUnits(product?.stockType, t);
  const unitOption = unitOptions.find((option) => option.key === unit) || unitOptions[0];
  const normalizedQty = qtyNum * (unitOption?.factor || 1);
  const current = currentStockValue(product);
  const preview = direction === 'IN' ? current + normalizedQty : Math.max(0, current - normalizedQty);

  function handleSave() {
    if (!product || qtyNum <= 0) {
      setError(t('stock.adjustment.errorQuantity'));
      return;
    }
    setError(null);
    adjustStock.mutate(
      { productId: product.id, type: direction, quantity: normalizedQty, description: [reason, note].filter(Boolean).join(' — ') || undefined },
      { onSuccess: () => adsService.showInterstitialThenContinue(() => navigation.goBack(), { requirePriorShow: true }) }
    );
  }

  if (!product) return <AnimatedScreen><Header title={t('stock.adjustment.title')} /></AnimatedScreen>;

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('stock.adjustment.title')} />

        <KeyboardAwareView>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
            <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.surface.border }} />
            <View>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{product.name}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('stock.adjustment.currentStockLabel').replace('{stock}', formatStockLabel(product))}</Text>
            </View>
          </View>

          <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
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
            <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs, textAlign }]}>{t('stock.adjustment.quantity')} ({unitOption?.label})</Text>
            {unitOptions.length > 1 ? <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
              {unitOptions.map((option) => <Pressable key={option.key} onPress={() => setUnit(option.key)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.md, borderWidth: 1, borderColor: unit === option.key ? colors.brand.primary : colors.surface.border, backgroundColor: unit === option.key ? colors.brand.primary : colors.surface.raised }}><Text style={[typography.caption, { color: unit === option.key ? colors.ink.onBrand : colors.ink.secondary }]}>{option.label}</Text></Pressable>)}
            </View> : null}
            <TextField
              label={`${t('stock.adjustment.quantity')} (${unitOption?.label})`}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
              textAlign={textAlign}
              right={<Text style={[typography.caption, { color: colors.ink.secondary, marginLeft: spacing.sm }]}>{t('stock.adjustment.newValue').replace('{value}', `${round(preview / (unitOption?.factor || 1))} ${unitOption?.label}`)}</Text>}
            />
          </View>

          <TextField label={t('stock.adjustment.reason')} value={reason} onChangeText={setReason} placeholder="Purchase from supplier" style={{ textAlign }} />
          <TextField label={t('stock.adjustment.noteOptional')} value={note} onChangeText={setNote} placeholder="Invoice #4471, MediCorp Distributors" style={{ textAlign }} />

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{error}</Text> : null}
          </KeyboardAwareScrollView>

          <View style={{ padding: spacing.lg, marginTop: 'auto' }}>
            <Button title={t('stock.adjustment.saveAdjustment')} onPress={handleSave} loading={adjustStock.isPending} />
          </View>
        </KeyboardAwareView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function adjustmentUnits(stockType, t) {
  switch (stockType) {
    case 'AREA':
      return [{ key: 'ft2', label: t('billing.squareFeet'), factor: 929.0304 }, { key: 'm2', label: t('billing.squareMeters'), factor: 10000 }, { key: 'cm2', label: t('billing.squareCentimeters'), factor: 1 }];
    case 'LENGTH':
      return [{ key: 'meter', label: t('billing.meters'), factor: 100 }, { key: 'feet', label: t('billing.unit.feet'), factor: 30.48 }, { key: 'cm', label: t('billing.unit.cm'), factor: 1 }];
    case 'LIQUID':
      return [{ key: 'liter', label: t('billing.liters'), factor: 1000 }, { key: 'ml', label: t('billing.milliliters'), factor: 1 }];
    case 'PACK':
      return [{ key: 'pack', label: t('receipt.packs'), factor: 1 }];
    default:
      return [{ key: 'unit', label: t('receipt.units'), factor: 1 }];
  }
}
