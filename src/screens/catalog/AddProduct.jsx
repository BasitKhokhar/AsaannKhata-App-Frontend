import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useCategories } from '../../hooks/useCategories';
import { useCreateProduct } from '../../hooks/useProducts';

const MODES = [
  { key: 'QUANTITY', label: 'Qty' },
  { key: 'AREA', label: 'Area' },
  { key: 'LENGTH', label: 'Length' },
  { key: 'PACK', label: 'Pack' },
];

export default function AddProduct() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();

  const [name, setName] = useState('');
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

  function handleSave() {
    if (!name || !purchasePrice || !salePrice) {
      setError('Please fill in the product name and prices.');
      return;
    }
    if (stockType === 'AREA' && (!sheetWidth || !sheetHeight)) {
      setError('Please enter sheet width and height.');
      return;
    }
    setError(null);

    createProduct.mutate(
      {
        name,
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
      { onSuccess: () => navigation.goBack() }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>Add Product</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <TextField label="Product name" value={name} onChangeText={setName} placeholder="Ceramic Floor Tile 60x60" />

          {categories.length > 0 ? (
            <View>
              <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {categories.map((c) => {
                  const selected = c.id === categoryId;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(selected ? null : c.id)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.pill,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand.primary : colors.surface.border,
                        backgroundColor: selected ? colors.brand.primary + '1F' : 'transparent',
                      }}
                    >
                      <Text style={[typography.caption, { color: selected ? colors.brand.primary : colors.ink.secondary }]}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View>
            <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.sm }]}>Stock mode</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {MODES.map((m) => {
                const selected = m.key === stockType;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setStockType(m.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      borderWidth: selected ? 0 : 1,
                      borderColor: colors.surface.border,
                      backgroundColor: selected ? colors.brand.primary : 'transparent',
                    }}
                  >
                    <Text style={[typography.label, { color: selected ? '#FAF9F6' : colors.ink.secondary }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {stockType === 'AREA' && (
            <View style={{ backgroundColor: colors.brand.accentLight + '1F', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.accentDark, letterSpacing: 0.5 }]}>AREA FIELDS</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextField label="Width" value={sheetWidth} onChangeText={setSheetWidth} placeholder="60" keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label="Height" value={sheetHeight} onChangeText={setSheetHeight} placeholder="60" keyboardType="numeric" style={{ flex: 1 }} />
              </View>
              <UnitPicker unit={unit} setUnit={setUnit} options={['cm', 'inch', 'feet', 'meter']} />
              <TextField label="Number of sheets in stock" value={quantity} onChangeText={setQuantity} placeholder="e.g. 40" keyboardType="numeric" />
            </View>
          )}

          {stockType === 'LENGTH' && (
            <View style={{ backgroundColor: colors.brand.primary + '14', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.primary, letterSpacing: 0.5 }]}>LENGTH FIELDS</Text>
              <TextField label="Current stock" value={quantity} onChangeText={setQuantity} placeholder="86" keyboardType="numeric" />
              <UnitPicker unit={unit} setUnit={setUnit} options={['cm', 'meter', 'feet', 'inch']} />
            </View>
          )}

          {stockType === 'PACK' && (
            <View style={{ backgroundColor: colors.brand.accentLight + '1F', borderRadius: radii.md, padding: spacing.md, gap: spacing.sm }}>
              <Text style={[typography.label, { color: colors.brand.accentDark, letterSpacing: 0.5 }]}>PACK FIELDS</Text>
              <TextField label="Units per pack" value={packSize} onChangeText={setPackSize} placeholder="6" keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextField label="Full packs" value={stockPacks} onChangeText={setStockPacks} placeholder="3" keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label="Loose units" value={stockLooseUnits} onChangeText={setStockLooseUnits} placeholder="8" keyboardType="numeric" style={{ flex: 1 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextField label="Pack purchase price (optional)" value={packPurchasePrice} onChangeText={setPackPurchasePrice} keyboardType="numeric" style={{ flex: 1 }} />
                <TextField label="Pack sale price (optional)" value={packSalePrice} onChangeText={setPackSalePrice} keyboardType="numeric" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {stockType === 'QUANTITY' && (
            <TextField label="Current stock" value={quantity} onChangeText={setQuantity} placeholder="e.g. 50" keyboardType="numeric" />
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextField
              label={`Purchase price${stockType === 'AREA' || stockType === 'LENGTH' ? ` (per ${unit})` : ''}`}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="Rs"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <TextField
              label={`Sale price${stockType === 'AREA' || stockType === 'LENGTH' ? ` (per ${unit})` : ''}`}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="Rs"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>

          <TextField
            label="Low stock threshold (optional)"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            placeholder="e.g. 10"
            keyboardType="numeric"
          />

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button title="Save Product" onPress={handleSave} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

function UnitPicker({ unit, setUnit, options }) {
  const { colors, radii, typography, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
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
            <Text style={[typography.caption, { color: selected ? '#FAF9F6' : colors.ink.secondary }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
