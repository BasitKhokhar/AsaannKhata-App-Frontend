import { BarcodeScanner } from '../../components/barcode/BarcodeScanner';
import { ScannerInput } from '../../components/barcode/ScannerInput';
import { useScannerStore } from '../../store/scannerStore';
import { useShopStore } from '../../store/shopStore';
import { productRepository } from '../../db/repositories/productRepository';
import { lineFor, assertCartStock } from '../../utils/cartLines';
import { showToast } from '../../store/toastStore';
import { BarcodeUnknown } from '../../components/barcode/BarcodeUnknown';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus, ReceiptText, ScanBarcode, Search, ShoppingCart } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Chip } from '../../components/ui/Chip';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { useTheme } from '../../theme';
import { useProductPages } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/money';
import { formatStockLabel, isOutOfStock } from '../../utils/stock';
import { useT, useIsUrdu } from '../../store/languageStore';
import { useEntitlement } from '../../hooks/useEntitlement';
import { useCoinsStore } from '../../store/coinsStore';
import { isAdSupportedEntitlement } from '../../utils/entitlements';

function availableUnits(product) {
  if (product.stockType === 'AREA') return Math.floor((product.stockAreaCm2 || 0) / Math.max(1, product.sheetAreaCm2 || 1));
  if (product.stockType === 'LENGTH') return Math.floor((product.stockLengthCm || 0) / 100);
  if (product.stockType === 'PACK') return Math.floor(product.stockPacks || 0);
  return Math.floor(product.stockQuantity || 0);
}

export default function NewBill() {
  const navigation = useNavigation();
  const { data: entitlement } = useEntitlement();
  const adCoins = useCoinsStore((state) => state.adCoins);
  const billsUsedToday = useCoinsStore((state) => state.billsUsedToday);
  const freeDailyRecordLimit = useCoinsStore((state) => state.freeDailyRecordLimit);
  const billCoinCost = useCoinsStore((state) => state.billCoinCost);
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const shopId = useShopStore((s) => s.activeShopId);
  const external = useScannerStore((s) => s.external);
  const [scanning, setScanning] = useState(false);
  const [unknown, setUnknown] = useState(null);
  const [saleUnit, setSaleUnit] = useState('default');
  const cart = useCartStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const { rows: products, loadMore, isError, refetch } = useProductPages({ search });
  useEffect(() => {
    useCartStore.getState().bindShop(shopId);
    setSelected(null); setUnknown(null); setScanning(false); setSearch(''); setError('');
  }, [shopId]);

  useEffect(() => {
    if (isAdSupportedEntitlement(entitlement)) useCoinsStore.getState().refresh().catch(() => {});
  }, [entitlement]);
  const cartCounts = useMemo(() => {
    const result = new Map();
    for (const line of cart.lines) result.set(line.productId, (result.get(line.productId) || 0) + (Number(line.quantity) || 1));
    return result;
  }, [cart.lines]);

  function scan(code) {
    try {
      const product = productRepository.findByBarcode(shopId, code);
      if (!product) { setUnknown(code); return; }
      if (product.stockType === 'AREA' || product.stockType === 'LENGTH') { openProduct(product); return; }
      const store = useCartStore.getState();
      store.bindShop(shopId);
      const line = lineFor(product, 1, product.barcodeUnit);
      assertCartStock(product, useCartStore.getState().lines, line);
      useCartStore.getState().addScannedLine(line);
      setError('');
      showToast(t('barcode.added').replace('{name}', product.name), 'success');
    } catch (cause) { setError(t(cause.message)); }
  }

  const cartCount = cart.lines.reduce((sum, line) => sum + (Number(line.quantity) || 1), 0);

  function openProduct(product) {
    if (isOutOfStock(product)) return;
    setSaleUnit(product.barcodeUnit || (product.stockType === 'PACK' && !product.stockPacks ? 'loose' : 'default'));
    setSelected(product);
    setQuantity(product.stockType === 'LENGTH' ? Math.min(1, product.stockLengthCm / 100) : 1);
    setError('');
  }

  function addToCart() {
    if (!selected) return;
    try {
      const fresh = productRepository.getById(selected.id);
      if (!fresh || fresh.shopId !== shopId || fresh.isDeleted) throw new Error('barcode.notFound');
      const line = lineFor(fresh, quantity, saleUnit);
      assertCartStock(fresh, useCartStore.getState().lines, line);
      cart.addLine(line);
    } catch (cause) { setError(t(cause.message)); return; }
    setSelected(null);
    setError('');
  }

  function checkout() {
    if (!cart.lines.length) {
      setError(t('billing.addAtLeastOneProduct'));
      return;
    }
    const needsCoins = isAdSupportedEntitlement(entitlement)
      && freeDailyRecordLimit > 0
      && billsUsedToday >= freeDailyRecordLimit;
    if (needsCoins && adCoins < (billCoinCost || 1)) {
      showToast(t('billing.coinsRequired'), 'warning');
      navigation.navigate('EarnCoins');
      return;
    }
    navigation.navigate('Payment');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('billing.newBill')} subtitle={t('billing.catalogSubtitle')} right={
          <Pressable onPress={() => navigation.navigate('Records')} accessibilityRole="button" style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs, padding: spacing.sm }}>
            <ReceiptText size={18} color={colors.brand.primary} />
            <Text style={[typography.label, { color: colors.brand.primary }]}>{t('nav.records')}</Text>
          </Pressable>
        } />
        <SubscriptionBanner />
        <View style={{ marginHorizontal: spacing.lg, marginVertical: spacing.sm, flexDirection: direction, alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1, height: 46, borderRadius: radii.md, backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.surface.border, flexDirection: direction, alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm }}>
            <Search size={17} color={colors.ink.secondary} />
            <TextInput value={search} onChangeText={setSearch} maxLength={128} placeholder={t('billing.searchProducts')} placeholderTextColor={colors.ink.secondary} style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign: align }]} />
          </View>
          <Pressable
            onPress={() => navigation.navigate('AddProduct')}
            accessibilityRole="button"
            accessibilityLabel={t('billing.addProduct')}
            style={{ height: 46, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.brand.primary, backgroundColor: colors.brand.primary, flexDirection: direction, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, gap: spacing.xs }}
          >
            <Plus size={17} color={colors.ink.onBrand} />
            <Text style={[typography.label, { color: colors.ink.onBrand }]}>{t('billing.addProduct')}</Text>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm }}>
          <Button title={t('barcode.scan')} icon={<ScanBarcode size={18} color={colors.ink.inverse} />} onPress={() => setScanning(true)} />
          {external ? <ScannerInput onScan={scan} /> : null}
          {isError ? <Button title={t('barcode.retry')} variant="ghost" onPress={refetch} /> : null}
        </View>
        <FlashList data={products} keyExtractor={(product) => product.id} numColumns={3}
          extraData={cartCounts} onEndReached={loadMore} onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={<View style={{ padding: spacing.xl }}><Text style={{ color: colors.ink.secondary }}>{t('billing.noProductsFound')}</Text></View>}
          renderItem={({ item: product }) => {
            const unavailable = isOutOfStock(product);
            const inCart = cartCounts.get(product.id) || 0;
            const imageUri = product.imageLocalUri || product.imageRemoteUrl;
            return <Pressable accessibilityRole="button" onPress={() => openProduct(product)} disabled={unavailable}
              style={{ flex: 1, margin: spacing.xs, minHeight: 148, borderRadius: radii.md, backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: inCart ? colors.brand.primary : colors.surface.border, padding: spacing.sm, justifyContent: 'space-between', opacity: unavailable ? 0.5 : 1 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                  {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={[typography.h2, { color: colors.brand.primary }]}>{product.name.trim().charAt(0).toLocaleUpperCase()}</Text>}
                </View>
              </View>
              {inCart ? <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={[typography.caption, { color: colors.ink.onBrand }]}>{inCart}×</Text></View> : null}
              <Text numberOfLines={2} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{product.name}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(product.stockType === 'PACK' ? (product.packSalePrice ?? product.salePrice * (product.packSize || 1)) : product.salePrice)}</Text>
            </Pressable>;
          }} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, backgroundColor: colors.surface.bg }}>
          {error && !selected ? <Text style={[typography.caption, { color: colors.semantic.danger, marginBottom: spacing.xs, textAlign: align }]}>{error}</Text> : null}
          <Button title={`${t('billing.goToCheckout')} · ${cartCount}`} onPress={checkout} icon={<ShoppingCart size={18} color={colors.ink.onBrand} />} />
        </View>
      </SafeAreaView>
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Pressable onPress={() => setSelected(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface.overlay }} />
          {selected ? <View style={[{ width: '100%', maxWidth: 440, maxHeight: '86%', borderRadius: radii.xl, backgroundColor: colors.surface.card, overflow: 'hidden' }, elevation.xl]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 88, height: 88, borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                  {selected.imageLocalUri || selected.imageRemoteUrl ? <Image source={{ uri: selected.imageLocalUri || selected.imageRemoteUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={[typography.h1, { color: colors.brand.primary }]}>{selected.name.trim().charAt(0).toLocaleUpperCase()}</Text>}
                </View>
                <Text style={[typography.h2, { color: colors.ink.primary, textAlign: 'center' }]}>{selected.name}</Text>
                <Text style={[typography.h2, { color: colors.brand.primary }]}>{formatCurrency(selected.stockType === 'PACK' && saleUnit !== 'loose' ? (selected.packSalePrice ?? selected.salePrice * (selected.packSize || 1)) : selected.salePrice)}</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatStockLabel(selected)}</Text>
              </View>
              {selected.stockType === 'PACK' ? <View style={{ flexDirection: direction, gap: spacing.sm }}>
                <Chip label={t('barcode.defaultUnit')} selected={saleUnit !== 'loose'} onPress={() => { setSaleUnit('default'); setQuantity(1); }} />
                <Chip label={t('barcode.loose')} selected={saleUnit === 'loose'} onPress={() => { setSaleUnit('loose'); setQuantity(1); }} />
              </View> : null}
              {selected.stockType === 'LENGTH' || selected.stockType === 'AREA' ? <TextField label={t(selected.stockType === 'LENGTH' ? 'billing.meters' : 'billing.quantity')} value={String(quantity)} keyboardType="decimal-pad" onChangeText={(value) => setQuantity(value)} /> : null}
              <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
                <QuantityButton icon={Minus} onPress={() => setQuantity((value) => Math.max(1, value - 1))} colors={colors} radii={radii} />
                <View style={{ minWidth: 72, alignItems: 'center' }}><Text style={[typography.h1, { color: colors.ink.primary }]}>{quantity}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{selected.stockType === 'LENGTH' ? t('billing.meters') : saleUnit === 'loose' ? t('barcode.loose') : t('billing.quantity')}</Text></View>
                <QuantityButton icon={Plus} onPress={() => setQuantity((value) => Math.max(value, Math.min(saleUnit === 'loose' ? selected.stockLooseUnits : availableUnits(selected), Number(value) + 1)))} colors={colors} radii={radii} />
              </View>
              <View style={{ flexDirection: direction, justifyContent: 'space-between' }}><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.lineTotal')}</Text><Text style={[typography.h3, { color: colors.ink.primary }]}>{formatCurrency(Number(quantity) > 0 ? lineFor(selected, quantity, saleUnit).total : 0)}</Text></View>
              {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}
              <Button title={t('billing.addToCart')} onPress={addToCart} />
              <Button title={t('common.cancel')} variant="ghost" compact onPress={() => setSelected(null)} />
            </ScrollView>
          </View> : null}
        </View>
      </Modal>
      <BarcodeScanner visible={scanning} onClose={() => setScanning(false)} onScan={scan} />
      <BarcodeUnknown code={unknown} onClose={() => setUnknown(null)} onLinked={scan} />
    </AnimatedScreen>
  );
}

function QuantityButton({ icon: Icon, onPress, colors, radii }) {
  return <Pressable onPress={onPress} style={{ width: 44, height: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.ink.primary} /></Pressable>;
}
