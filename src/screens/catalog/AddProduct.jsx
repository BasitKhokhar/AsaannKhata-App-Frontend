import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Pencil, Package, Ruler, Boxes, ScanLine, ChevronRight } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Chip } from '../../components/ui/Chip';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useCategories } from '../../hooks/useCategories';
import { useCreateProduct } from '../../hooks/useProducts';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function AddProduct() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const MODES = [
    { key: 'QUANTITY', label: t('catalog.addProduct.modeQty') },
    { key: 'AREA', label: t('catalog.addProduct.modeArea') },
    { key: 'LENGTH', label: t('catalog.addProduct.modeLength') },
    { key: 'PACK', label: t('catalog.addProduct.modePack') },
  ];

  const [name, setName] = useState('');
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [stockType, setStockType] = useState('QUANTITY');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [error, setError] = useState(null);

  // Mode-specific fields
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('cm');
  const [sheetWidth, setSheetWidth] = useState('');
  const [sheetHeight, setSheetHeight] = useState('');
  const [packSize, setPackSize] = useState('');
  const [stockPacks, setStockPacks] = useState('');
  const [stockLooseUnits, setStockLooseUnits] = useState('');
  const [packPurchasePrice, setPackPurchasePrice] = useState('');
  const [packSalePrice, setPackSalePrice] = useState('');

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('catalog.addProduct.errorPhotoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  function handleSave() {
    if (!name.trim() || purchasePrice.trim() === '' || salePrice.trim() === '') {
      setError(t('catalog.addProduct.errorNameAndPrices'));
      return;
    }
    const validNonnegative = (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);
    const numericFields = [purchasePrice, salePrice, quantity, lowStockThreshold, stockPacks, stockLooseUnits, packPurchasePrice, packSalePrice];
    if (!numericFields.every(validNonnegative) || (stockType === 'PACK' && (!Number.isInteger(Number(packSize)) || Number(packSize) <= 0))) {
      setError(t('catalog.addProduct.errorInvalidNumbers'));
      return;
    }
    if (stockType === 'AREA' && (!sheetWidth || !sheetHeight)) {
      setError(t('catalog.addProduct.errorSheetDims'));
      return;
    }
    if (stockType === 'AREA' && (!(Number(sheetWidth) > 0) || !(Number(sheetHeight) > 0))) {
      setError(t('catalog.addProduct.errorInvalidNumbers'));
      return;
    }
    setError(null);

    createProduct.mutate(
      {
        name,
        // Local-only: this is a device file URI, not uploaded anywhere — it won't sync to other devices/cloud until the sync push protocol carries binary files.
        image,
        categoryId,
        stockType,
        purchasePrice,
        salePrice,
        lowStockThreshold: lowStockThreshold || null,
        unit,
        quantity,
        sheetWidth,
        sheetHeight,
        packSize,
        stockPacks,
        stockLooseUnits,
        packPurchasePrice,
        packSalePrice,
      },
      { onSuccess: () => navigation.goBack(), onError: () => setError(t('catalog.addProduct.errorSaveFailed')) }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('catalog.addProduct.title')} onBack={step === 1 ? () => setStep(0) : undefined} />
        <View style={{ flexDirection: rowDirection, gap: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          {[0, 1].map((index) => <View key={index} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: index <= step ? colors.brand.primary : colors.surface.border }} />)}
        </View>

        {step === 0 ? (
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
            <Text style={[typography.body, { color: colors.ink.secondary, marginBottom: spacing.sm, textAlign }]}>{t('catalog.addProduct.chooseUnitDescription')}</Text>
            {[
              { key: 'QUANTITY', icon: Package, detail: 'catalog.addProduct.modeQtyDetail' },
              { key: 'PACK', icon: Boxes, detail: 'catalog.addProduct.modePackDetail' },
              { key: 'LENGTH', icon: Ruler, detail: 'catalog.addProduct.modeLengthDetail' },
              { key: 'AREA', icon: ScanLine, detail: 'catalog.addProduct.modeAreaDetail' },
            ].map((option) => {
              const Icon = option.icon;
              const selected = stockType === option.key;
              return (
                <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setStockType(option.key)} style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface.raised, borderRadius: radii.md, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brand.primary : colors.surface.border, padding: spacing.md }}>
                  <View style={{ width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.brand.primary + '16', alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={colors.brand.primary} strokeWidth={1.8} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{MODES.find((mode) => mode.key === option.key)?.label}</Text>
                    <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t(option.detail)}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.ink.secondary} />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Pressable
            onPress={handlePickImage}
            style={{ alignItems: 'center', marginBottom: spacing.sm }}
          >
            <View style={{ width: 88, height: 88 }}>
              <View
                style={[
                  {
                    width: 88,
                    height: 88,
                    borderRadius: radii.xl,
                    backgroundColor: colors.surface.card,
                    borderWidth: 1,
                    borderColor: colors.surface.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  },
                  elevation.xs,
                ]}
              >
                {image ? (
                  <Image source={{ uri: image }} style={{ width: 88, height: 88 }} resizeMode="cover" />
                ) : (
                  <Camera size={26} color={colors.ink.secondary} strokeWidth={1.6} />
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: radii.pill,
                  backgroundColor: colors.brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.surface.bg,
                }}
              >
                <Pencil size={13} color={colors.ink.onBrand} strokeWidth={2} />
              </View>
            </View>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs }]}>
              {image ? t('catalog.addProduct.changePhoto') : t('catalog.addProduct.addPhotoOptional')}
            </Text>
          </Pressable>

          <TextField label={t('catalog.addProduct.productName')} value={name} onChangeText={setName} placeholder="Ceramic Floor Tile 60x60" style={{ textAlign }} />

          {categories.length > 0 ? (
            <View>
              <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs, textAlign }]}>{t('catalog.addProduct.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, flexDirection: isUrdu ? 'row-reverse' : 'row' }}>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    selected={c.id === categoryId}
                    onPress={() => setCategoryId(c.id === categoryId ? null : c.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.sm, textAlign }]}>{t('catalog.addProduct.stockMode')}</Text>
            <View style={{ flexDirection: rowDirection, gap: spacing.xs }}>
              {MODES.map((m) => (
                <Chip
                  key={m.key}
                  label={m.label}
                  selected={m.key === stockType}
                  onPress={() => setStockType(m.key)}
                  style={{ flex: 1, alignItems: 'center' }}
                />
              ))}
            </View>
          </View>

          {stockType === 'AREA' && (
            <View style={{ backgroundColor: colors.brand.accentLight + '1F', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.accentDark, letterSpacing: 0.5, textAlign }]}>{t('catalog.addProduct.areaFields')}</Text>
              <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
                <TextField label={t('catalog.addProduct.width')} value={sheetWidth} onChangeText={setSheetWidth} placeholder="60" keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label={t('catalog.addProduct.height')} value={sheetHeight} onChangeText={setSheetHeight} placeholder="60" keyboardType="numeric" style={{ flex: 1 }} />
              </View>
              <UnitPicker unit={unit} setUnit={setUnit} options={['cm', 'inch', 'feet', 'meter']} />
              <TextField label={t('catalog.addProduct.sheetsInStock')} value={quantity} onChangeText={setQuantity} placeholder="e.g. 40" keyboardType="numeric" style={{ textAlign }} />
            </View>
          )}

          {stockType === 'LENGTH' && (
            <View style={{ backgroundColor: colors.brand.primary + '14', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.primary, letterSpacing: 0.5, textAlign }]}>{t('catalog.addProduct.lengthFields')}</Text>
              <TextField label={t('catalog.addProduct.currentStock')} value={quantity} onChangeText={setQuantity} placeholder="86" keyboardType="numeric" style={{ textAlign }} />
              <UnitPicker unit={unit} setUnit={setUnit} options={['cm', 'meter', 'feet', 'inch']} />
            </View>
          )}

          {stockType === 'PACK' && (
            <View style={{ backgroundColor: colors.brand.accentLight + '1F', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.accentDark, letterSpacing: 0.5, textAlign }]}>{t('catalog.addProduct.packFields')}</Text>
              <TextField label={t('catalog.addProduct.unitsPerPack')} value={packSize} onChangeText={setPackSize} placeholder="6" keyboardType="numeric" style={{ textAlign }} />
              <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
                <TextField label={t('catalog.addProduct.fullPacks')} value={stockPacks} onChangeText={setStockPacks} placeholder="3" keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label={t('catalog.addProduct.looseUnits')} value={stockLooseUnits} onChangeText={setStockLooseUnits} placeholder="8" keyboardType="numeric" style={{ flex: 1 }} />
              </View>
              <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
                <TextField label={t('catalog.addProduct.packPurchasePriceOptional')} value={packPurchasePrice} onChangeText={setPackPurchasePrice} keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label={t('catalog.addProduct.packSalePriceOptional')} value={packSalePrice} onChangeText={setPackSalePrice} keyboardType="numeric" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {stockType === 'QUANTITY' && (
            <TextField label={t('catalog.addProduct.currentStock')} value={quantity} onChangeText={setQuantity} placeholder="e.g. 50" keyboardType="numeric" style={{ textAlign }} />
          )}

          <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
            <TextField
              label={`${t('catalog.addProduct.purchasePrice')}${stockType === 'AREA' || stockType === 'LENGTH' ? ` (${t('catalog.addProduct.perUnit').replace('{unit}', unit)})` : ''}`}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="Rs"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <TextField
              label={`${t('catalog.addProduct.salePrice')}${stockType === 'AREA' || stockType === 'LENGTH' ? ` (${t('catalog.addProduct.perUnit').replace('{unit}', unit)})` : ''}`}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="Rs"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>

          <TextField
            label={`${t('catalog.addProduct.lowStockThresholdOptional')}${stockType === 'AREA' ? ` (${unit}²)` : stockType === 'LENGTH' ? ` (${unit})` : ''}`}
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            placeholder="e.g. 10"
            keyboardType="numeric"
            style={{ textAlign }}
          />

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{error}</Text> : null}
        </ScrollView>
        )}

        <View style={{ padding: spacing.lg }}>
          <Button title={step === 0 ? t('common.next') : t('catalog.addProduct.saveProduct')} onPress={step === 0 ? () => setStep(1) : handleSave} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function UnitPicker({ unit, setUnit, options }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isUrdu = useIsUrdu();
  return (
    <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', gap: spacing.xs }}>
      {options.map((opt) => {
        const selected = opt === unit;
        return (
          <Pressable
            key={opt}
            onPress={() => setUnit(opt)}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: radii.sm,
              backgroundColor: selected ? colors.brand.primary : colors.surface.bg,
              borderWidth: 1,
              borderColor: selected ? colors.brand.primary : colors.surface.border,
            }}
          >
            <Text style={[typography.caption, { color: selected ? colors.ink.onBrand : colors.ink.secondary }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
