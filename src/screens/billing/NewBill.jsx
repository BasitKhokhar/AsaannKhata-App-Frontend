import { BarcodeScanner } from '../../components/barcode/BarcodeScanner';
import { ScannerInput } from '../../components/barcode/ScannerInput';
import { useScannerStore } from '../../store/scannerStore';
import { useShopStore } from '../../store/shopStore';
import { productRepository } from '../../db/repositories/productRepository';
import { lineFor, assertCartStock } from '../../utils/cartLines';
import { showToast } from '../../store/toastStore';
import { BarcodeUnknown } from '../../components/barcode/BarcodeUnknown';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus, ReceiptText, ScanBarcode, Search, ShoppingCart, X, Tag, PackageCheck } from 'lucide-react-native';
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
  if (product.stockType === 'LIQUID') return (product.stockVolumeMl || 0) / 1000;
  return Math.floor(product.stockQuantity || 0);
}

function displaySalePrice(product, saleUnit = 'default', measurementUnit = 'feet') {
  if (product.stockType === 'PACK' && saleUnit !== 'loose') return product.packSalePrice ?? product.salePrice * (product.packSize || 1);
  if (product.stockType === 'LIQUID' && saleUnit !== 'ml') return product.salePrice * 1000;
  if (product.stockType === 'LENGTH') return product.salePrice * 100;
  if (product.stockType === 'AREA') {
    const factor = measurementUnit === 'meter' ? 100 : measurementUnit === 'feet' ? 30.48 : measurementUnit === 'inch' ? 2.54 : 1;
    return product.salePrice * factor * factor;
  }
  return product.salePrice;
}

function displayPriceUnit(product, saleUnit, measurementUnit, t) {
  if (product.stockType === 'AREA') return `${t(`billing.unit.${measurementUnit}`)}²`;
  if (product.stockType === 'LENGTH') return t('billing.meters');
  if (product.stockType === 'LIQUID') return saleUnit === 'ml' ? t('billing.milliliterShort') : t('billing.literShort');
  return null;
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
  const [measurementUnit, setMeasurementUnit] = useState('feet');
  const [salePrice, setSalePrice] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
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
      if (product.stockType === 'AREA' || product.stockType === 'LENGTH' || product.stockType === 'LIQUID') { openProduct(product); return; }
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
    setSaleUnit(product.stockType === 'LIQUID' ? 'liter' : product.barcodeUnit || (product.stockType === 'PACK' && !product.stockPacks ? 'loose' : 'default'));
    setMeasurementUnit('feet');
    setSalePrice(String(displaySalePrice(product, product.stockType === 'LIQUID' ? 'liter' : product.barcodeUnit || 'default', 'feet')));
    setWidth('');
    setHeight('');
    setSelected(product);
    setQuantity(product.stockType === 'LENGTH' ? Math.min(1, product.stockLengthCm / 100) : 1);
    setError('');
  }

  function normalizedSalePrice(value = salePrice) {
    const entered = Number(value);
    if (!Number.isFinite(entered) || value === '' || entered < 0 || !selected) return null;
    if (selected.stockType === 'AREA') {
      const factor = measurementUnit === 'meter' ? 100 : measurementUnit === 'feet' ? 30.48 : measurementUnit === 'inch' ? 2.54 : 1;
      return entered / (factor * factor);
    }
    if (selected.stockType === 'LENGTH') return entered / 100;
    if (selected.stockType === 'LIQUID' && saleUnit === 'liter') return entered / 1000;
    return entered;
  }

  function updateMeasurementUnit(nextUnit) {
    setMeasurementUnit(nextUnit);
    if (selected) setSalePrice(String(displaySalePrice(selected, saleUnit, nextUnit)));
  }

  function addToCart() {
    if (!selected) return;
    try {
      const fresh = productRepository.getById(selected.id);
      if (!fresh || fresh.shopId !== shopId || fresh.isDeleted) throw new Error('barcode.notFound');
      const line = lineFor(fresh, quantity, saleUnit, { width, height, unit: measurementUnit, priceOverride: normalizedSalePrice() });
      assertCartStock(fresh, useCartStore.getState().lines, line);
      cart.addLine(line);
    } catch (cause) { setError(t(cause.message)); return; }
    setSelected(null);
    setError('');
  }

  function lineTotal() {
    if (!selected) return 0;
    try {
      return lineFor(selected, quantity, saleUnit, { width, height, unit: measurementUnit, priceOverride: normalizedSalePrice() }).total;
    } catch {
      return 0;
    }
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
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(displaySalePrice(product))}{displayPriceUnit(product, 'liter', 'feet', t) ? ` / ${displayPriceUnit(product, 'liter', 'feet', t)}` : ''}</Text>
            </Pressable>;
          }} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface.border, backgroundColor: colors.surface.bg }}>
          {error && !selected ? <Text style={[typography.caption, { color: colors.semantic.danger, marginBottom: spacing.xs, textAlign: align }]}>{error}</Text> : null}
          <Button title={`${t('billing.goToCheckout')} · ${cartCount}`} onPress={checkout} icon={<ShoppingCart size={18} color={colors.ink.onBrand} />} />
        </View>
      </SafeAreaView>
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Pressable onPress={() => setSelected(null)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface.overlay }} />
          {selected ? <View style={[{ width: '100%', maxWidth: 440, maxHeight: '86%', borderRadius: radii.xl, backgroundColor: colors.surface.card, overflow: 'hidden' }, elevation.xl]}>
            <ScrollView style={{ maxHeight: '86%' }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
              <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <View style={{ width: 58, height: 58, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                    {selected.imageLocalUri || selected.imageRemoteUrl ? <Image source={{ uri: selected.imageLocalUri || selected.imageRemoteUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={[typography.h2, { color: colors.brand.primary }]}>{selected.name.trim().charAt(0).toLocaleUpperCase()}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text numberOfLines={2} style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{selected.name}</Text>
                    <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{formatStockLabel(selected)}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelected(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')} style={{ width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={19} color={colors.ink.secondary} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={{ height: 1, backgroundColor: colors.surface.border }} />
              {selected.stockType === 'PACK' ? <View style={{ flexDirection: direction, gap: spacing.sm }}>
                <Chip label={t('barcode.defaultUnit')} selected={saleUnit !== 'loose'} onPress={() => { setSaleUnit('default'); setQuantity(1); setSalePrice(String(displaySalePrice(selected, 'default', measurementUnit))); }} />
                <Chip label={t('barcode.loose')} selected={saleUnit === 'loose'} onPress={() => { setSaleUnit('loose'); setQuantity(1); setSalePrice(String(displaySalePrice(selected, 'loose', measurementUnit))); }} />
              </View> : null}
              {selected.stockType === 'LIQUID' ? <View style={{ gap: spacing.sm }}>
                <Text style={[typography.label, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.liquidUnit')}</Text>
                <View style={{ flexDirection: direction, gap: spacing.sm }}>
                  <Chip label={t('billing.liters')} selected={saleUnit === 'liter'} onPress={() => { setSaleUnit('liter'); setQuantity(1); setSalePrice(String(displaySalePrice(selected, 'liter', measurementUnit))); }} />
                  <Chip label={t('billing.milliliters')} selected={saleUnit === 'ml'} onPress={() => { setSaleUnit('ml'); setQuantity(500); setSalePrice(String(displaySalePrice(selected, 'ml', measurementUnit))); }} />
                </View>
                <TextField label={t('billing.volume')} value={String(quantity)} keyboardType="decimal-pad" onChangeText={setQuantity} />
              </View> : null}
              {selected.stockType === 'AREA' ? <View style={{ gap: spacing.sm }}>
                <Text style={[typography.label, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.measurementUnit')}</Text>
                <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: spacing.xs }}>
                  {['cm', 'inch', 'feet', 'meter'].map((unit) => <Chip key={unit} label={t(`billing.unit.${unit}`)} selected={measurementUnit === unit} onPress={() => updateMeasurementUnit(unit)} />)}
                </View>
                <View style={{ flexDirection: direction, gap: spacing.sm }}>
                  <TextField label={t('billing.width')} value={width} keyboardType="decimal-pad" onChangeText={setWidth} style={{ flex: 1 }} />
                  <TextField label={t('billing.height')} value={height} keyboardType="decimal-pad" onChangeText={setHeight} style={{ flex: 1 }} />
                </View>
                <TextField label={t('billing.pieces')} value={String(quantity)} keyboardType="decimal-pad" onChangeText={setQuantity} />
                <View style={{ flexDirection: direction, justifyContent: 'space-between' }}><Text style={[typography.body, { color: colors.ink.secondary }]}>{t('billing.calculatedArea')}</Text><Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{Number(width) > 0 && Number(height) > 0 ? `${Number((Number(width) * Number(height) * Number(quantity || 0)).toFixed(3))} ${t(`billing.unit.${measurementUnit}`)}²` : '—'}</Text></View>
              </View> : null}
              {selected.stockType === 'LENGTH' ? <TextField label={t('billing.meters')} value={String(quantity)} keyboardType="decimal-pad" onChangeText={setQuantity} /> : null}
              {selected.stockType !== 'LENGTH' && selected.stockType !== 'LIQUID' ? <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
                <QuantityButton icon={Minus} onPress={() => setQuantity((value) => Math.max(1, value - 1))} colors={colors} radii={radii} />
                <View style={{ minWidth: 72, alignItems: 'center' }}><Text style={[typography.h1, { color: colors.ink.primary }]}>{quantity}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{selected.stockType === 'AREA' ? t('billing.pieces') : saleUnit === 'loose' ? t('barcode.loose') : t('billing.quantity')}</Text></View>
                <QuantityButton icon={Plus} onPress={() => setQuantity((value) => selected.stockType === 'AREA' ? Number(value) + 1 : Math.max(value, Math.min(saleUnit === 'loose' ? selected.stockLooseUnits : availableUnits(selected), Number(value) + 1)))} colors={colors} radii={radii} />
              </View> : null}
              <View style={{ backgroundColor: colors.brand.primary + '10', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.brand.primary + '32', padding: spacing.md, gap: spacing.sm }}>
                <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs }}>
                  <Tag size={16} color={colors.brand.primary} strokeWidth={2} />
                  <Text style={[typography.label, { color: colors.brand.primary, textAlign: align }]}>{t('billing.pricingSection')}</Text>
                </View>
                <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.defaultSalePrice')}</Text>
                  <Text style={[typography.bodyMedium, { color: colors.ink.secondary }]}>{formatCurrency(displaySalePrice(selected, saleUnit, measurementUnit))}</Text>
                </View>
                <TextField label={`${t('billing.finalSalePrice')}${displayPriceUnit(selected, saleUnit, measurementUnit, t) ? ` / ${displayPriceUnit(selected, saleUnit, measurementUnit, t)}` : ''}`} value={salePrice} keyboardType="decimal-pad" onChangeText={(value) => setSalePrice(value.replace(/[^0-9.]/g, ''))} />
                <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.finalSalePriceHint')}</Text>
              </View>
              <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface.raised, borderRadius: radii.md, padding: spacing.md }}><View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs }}><PackageCheck size={17} color={colors.ink.secondary} /><Text style={[typography.body, { color: colors.ink.secondary, textAlign: align }]}>{t('billing.lineTotal')}</Text></View><Text style={[typography.h3, { color: colors.ink.primary }]}>{formatCurrency(lineTotal())}</Text></View>
              {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: align }]}>{error}</Text> : null}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.surface.card }}>
              <Button title={t('common.cancel')} variant="outline" compact onPress={() => setSelected(null)} style={{ flex: 1 }} />
              <Button title={t('billing.addToCart')} compact onPress={addToCart} style={{ flex: 1 }} />
            </View>
          </View> : null}
        </KeyboardAvoidingView>
      </Modal>
      <BarcodeScanner visible={scanning} onClose={() => setScanning(false)} onScan={scan} />
      <BarcodeUnknown code={unknown} onClose={() => setUnknown(null)} onLinked={scan} />
    </AnimatedScreen>
  );
}

function QuantityButton({ icon: Icon, onPress, colors, radii }) {
  return <Pressable onPress={onPress} style={{ width: 44, height: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.ink.primary} /></Pressable>;
}
