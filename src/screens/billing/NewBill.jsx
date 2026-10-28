import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Minus, PackageOpen, Plus, ReceiptText, Search, ShoppingCart } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { useTheme } from '../../theme';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/money';
import { formatStockLabel, isOutOfStock } from '../../utils/stock';
import { useT, useIsUrdu } from '../../store/languageStore';

const round2 = (value) => Math.round(value * 100) / 100;

function lineFor(product, amount) {
  const quantity = Math.max(1, Number(amount) || 1);
  if (product.stockType === 'AREA') {
    const totalArea = (product.sheetAreaCm2 || 0) * quantity;
    return { productId: product.id, productName: product.name, stockType: 'AREA', quantity, unitArea: product.sheetAreaCm2, totalArea, pricePerUnit: product.salePrice, total: round2(totalArea * product.salePrice) };
  }
  if (product.stockType === 'LENGTH') {
    const lengthCm = quantity * 100;
    return { productId: product.id, productName: product.name, stockType: 'LENGTH', quantity, lengthCm, pricePerUnit: product.salePrice, total: round2(lengthCm * product.salePrice) };
  }
  if (product.stockType === 'PACK') {
    const pricePerUnit = product.packSalePrice ?? product.salePrice * (product.packSize || 1);
    return { productId: product.id, productName: product.name, stockType: 'PACK', quantity, packQuantity: quantity, looseQuantity: 0, pricePerUnit, total: round2(quantity * pricePerUnit) };
  }
  return { productId: product.id, productName: product.name, stockType: 'QUANTITY', quantity, pricePerUnit: product.salePrice, total: round2(quantity * product.salePrice) };
}

function availableUnits(product) {
  if (product.stockType === 'AREA') return Math.floor((product.stockAreaCm2 || 0) / Math.max(1, product.sheetAreaCm2 || 1));
  if (product.stockType === 'LENGTH') return Math.floor((product.stockLengthCm || 0) / 100);
  if (product.stockType === 'PACK') return Math.floor(product.stockPacks || 0);
  return Math.floor(product.stockQuantity || 0);
}

export default function NewBill() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { data: products = [] } = useProducts();
  const cart = useCartStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const groups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = products.filter((product) => !query || product.name.toLocaleLowerCase().includes(query));
    const map = new Map();
    filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach((product) => {
      const letter = product.name.trim().charAt(0).toLocaleUpperCase() || '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(product);
    });
    return [...map].map(([letter, items]) => ({ letter, items }));
  }, [products, search]);

  const cartCount = cart.lines.reduce((sum, line) => sum + (Number(line.quantity) || 1), 0);

  function openProduct(product) {
    if (isOutOfStock(product)) return;
    setSelected(product);
    setQuantity(1);
    setError('');
  }

  function addToCart() {
    if (!selected) return;
    if (quantity > availableUnits(selected)) {
      setError(t('billing.quantityExceedsStock'));
      return;
    }
    cart.addLine(lineFor(selected, quantity));
    setSelected(null);
    setError('');
  }

  function checkout() {
    if (!cart.lines.length) {
      setError(t('billing.addAtLeastOneProduct'));
      return;
    }
    navigation.navigate('Payment');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
          <View>
            <Text style={[typography.h2, { color: colors.ink.primary, textAlign: align }]}>{t('billing.newBill')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.catalogSubtitle')}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Records')} accessibilityRole="button" style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs, padding: spacing.sm }}>
            <ReceiptText size={18} color={colors.brand.primary} />
            <Text style={[typography.label, { color: colors.brand.primary }]}>{t('nav.records')}</Text>
          </Pressable>
        </View>
        <SubscriptionBanner />
        <View style={{ marginHorizontal: spacing.lg, marginVertical: spacing.sm, height: 46, borderRadius: radii.md, backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.surface.border, flexDirection: direction, alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm }}>
          <Search size={17} color={colors.ink.secondary} />
          <TextInput value={search} onChangeText={setSearch} placeholder={t('billing.searchProducts')} placeholderTextColor={colors.ink.secondary} style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign: align }]} />
        </View>
        <FlashList
          data={groups}
          keyExtractor={(group) => group.letter}
          estimatedItemSize={174}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListEmptyComponent={<View style={{ alignItems: 'center', padding: spacing.xxl, gap: spacing.sm }}><PackageOpen size={34} color={colors.ink.secondary} /><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.noProductsFound')}</Text></View>}
          renderItem={({ item: group }) => (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[typography.h3, { color: colors.ink.primary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, textAlign: align }]}>{group.letter}</Text>
              <FlatList
                horizontal
                inverted={isUrdu}
                showsHorizontalScrollIndicator={false}
                data={group.items}
                keyExtractor={(product) => product.id}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
                initialNumToRender={5}
                windowSize={5}
                renderItem={({ item: product }) => {
                  const unavailable = isOutOfStock(product);
                  const inCart = cart.lines.filter((line) => line.productId === product.id).reduce((sum, line) => sum + (Number(line.quantity) || 1), 0);
                  return (
                    <Pressable onPress={() => openProduct(product)} disabled={unavailable} style={[{ width: 116, minHeight: 126, borderRadius: radii.lg, backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: inCart ? colors.brand.primary : colors.surface.border, padding: spacing.md, justifyContent: 'space-between', opacity: unavailable ? 0.52 : 1 }, elevation.xs]}>
                      <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}><Text style={[typography.h3, { color: colors.brand.primary }]}>{product.name.trim().charAt(0).toLocaleUpperCase()}</Text></View>
                        {inCart ? <View style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={[typography.caption, { color: colors.ink.onBrand }]}>{inCart}</Text></View> : null}
                      </View>
                      <Text numberOfLines={2} style={[typography.bodyMedium, { color: colors.ink.primary, fontSize: 13, textAlign: align }]}>{product.name}</Text>
                      <Text style={[typography.caption, { color: colors.brand.primary, textAlign: align }]}>{formatCurrency(product.stockType === 'PACK' ? (product.packSalePrice ?? product.salePrice) : product.salePrice)}</Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          )}
        />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, backgroundColor: colors.surface.bg }}>
          {error && !selected ? <Text style={[typography.caption, { color: colors.semantic.danger, marginBottom: spacing.xs, textAlign: align }]}>{error}</Text> : null}
          <Button title={`${t('billing.goToCheckout')} · ${cartCount}`} onPress={checkout} icon={<ShoppingCart size={18} color={colors.ink.onBrand} />} />
        </View>
      </SafeAreaView>
      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.name} footer={<Button title={t('billing.addToCart')} onPress={addToCart} />}>
        {selected ? <>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}><Text style={[typography.h1, { color: colors.brand.primary }]}>{selected.name.trim().charAt(0).toLocaleUpperCase()}</Text></View>
            <Text style={[typography.numericLarge, { color: colors.ink.primary }]}>{formatCurrency(selected.stockType === 'PACK' ? (selected.packSalePrice ?? selected.salePrice) : selected.salePrice)}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatStockLabel(selected)}</Text>
          </View>
          <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
            <QuantityButton icon={Minus} onPress={() => setQuantity((value) => Math.max(1, value - 1))} colors={colors} radii={radii} />
            <View style={{ minWidth: 72, alignItems: 'center' }}><Text style={[typography.h1, { color: colors.ink.primary }]}>{quantity}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{selected.stockType === 'LENGTH' ? t('billing.meters') : t('billing.quantity')}</Text></View>
            <QuantityButton icon={Plus} onPress={() => setQuantity((value) => Math.min(availableUnits(selected), value + 1))} colors={colors} radii={radii} />
          </View>
          <View style={{ flexDirection: direction, justifyContent: 'space-between' }}><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.lineTotal')}</Text><Text style={[typography.h3, { color: colors.ink.primary }]}>{formatCurrency(lineFor(selected, quantity).total)}</Text></View>
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}
        </> : null}
      </Sheet>
    </AnimatedScreen>
  );
}

function QuantityButton({ icon: Icon, onPress, colors, radii }) {
  return <Pressable onPress={onPress} style={{ width: 44, height: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.ink.primary} /></Pressable>;
}
