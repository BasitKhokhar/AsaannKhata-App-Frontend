import React, { useState } from 'react';
import { View, Text, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus, Package, ScanBarcode } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { BarcodeScanner } from '../../components/barcode/BarcodeScanner';
import { BarcodeUnknown } from '../../components/barcode/BarcodeUnknown';
import { Button } from '../../components/ui/Button';
import { productRepository } from '../../db/repositories/productRepository';
import { useShopStore } from '../../store/shopStore';
import { PulseFab } from '../../components/motion/PulseFab';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { DataTable } from '../../components/ui/DataTable';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { BottomNav } from '../../components/ui/BottomNav';
import { useTheme } from '../../theme';
import { useProductPages } from '../../hooks/useProducts';
import { formatStockLabel, isLowStock, isOutOfStock } from '../../utils/stock';
import { formatCurrency } from '../../utils/money';
import { useT, useIsUrdu } from '../../store/languageStore';

const MODE_BADGE = { QUANTITY: 'QTY', AREA: 'AREA', LENGTH: 'LENGTH', PACK: 'PACK', LIQUID: 'LITRE' };

export default function ProductsList() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { rows: visible, isLoading, isRefetching, refetch, loadMore, isError } = useProductPages({ search, lowStock: filter === 'low' });
  const shopId = useShopStore((s) => s.activeShopId);
  const [scanning, setScanning] = useState(false);
  const [unknown, setUnknown] = useState(null);
  function scan(code) {
    const product = productRepository.findByBarcode(shopId, code);
    if (product) navigation.navigate('ProductDetail', { productId: product.id });
    else setUnknown(code);
  }
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const FILTERS = [
    { key: 'all', label: t('catalog.productsList.filterAll') },
    { key: 'low', label: t('catalog.productsList.filterLowStock') },
  ];

  const columns = [
    { key: 'product', label: t('stock.overview.product'), width: 205, render: (item) => <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}><View style={{ width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{item.imageLocalUri || item.imageRemoteUrl ? <Image source={{ uri: item.imageLocalUri || item.imageRemoteUrl }} style={{ width: 34, height: 34 }} resizeMode="cover" /> : <Package size={17} color={colors.ink.secondary} />}</View><Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, flex: 1, textAlign }]}>{item.name}</Text></View> },
    { key: 'stock', label: t('stock.overview.stock'), width: 125, render: (item) => { const out = isOutOfStock(item); const low = !out && isLowStock(item); return <View><Text numberOfLines={1} style={{ color: out ? colors.semantic.danger : low ? colors.semantic.warning : colors.ink.primary }}>{formatStockLabel(item)}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{out ? t('catalog.productsList.outOfStock') : low ? t('catalog.productsList.filterLowStock') : t('catalog.productDetail.inStock')}</Text></View>; } },
    { key: 'price', label: t('stock.overview.salePrice'), width: 100, render: (item) => formatCurrency(item.stockType === 'PACK' ? (item.packSalePrice ?? item.salePrice * (item.packSize || 1)) : item.stockType === 'LIQUID' ? item.salePrice * 1000 : item.salePrice) },
    { key: 'mode', label: t('stock.overview.status'), width: 92, align: 'center', render: (item) => <Badge label={MODE_BADGE[item.stockType] || 'QTY'} tone={item.stockType === 'AREA' || item.stockType === 'PACK' ? 'warning' : 'brand'} /> },
  ];



  return (
    <AnimatedScreen>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign }]}>{t('nav.products')}</Text>
        <SubscriptionBanner />

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              height: 42,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.surface.border,
              backgroundColor: colors.surface.card,
              flexDirection: rowDirection,
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Search size={16} color={colors.ink.secondary} strokeWidth={1.8} />
            <TextInput
              value={search}
              maxLength={128}
              onChangeText={setSearch}
              placeholder={t('billing.searchProducts')}
              placeholderTextColor={colors.ink.secondary}
              style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign }]}
            />
          </View>
        </View>

        <View style={{ flexDirection: rowDirection, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <Button
            title={t('barcode.scan')}
            icon={<ScanBarcode size={19} color={colors.ink.inverse} strokeWidth={2} />}
            onPress={() => setScanning(true)}
          />
          {isError ? <Button title={t('barcode.retry')} variant="ghost" onPress={refetch} /> : null}
        </View>
        {!isLoading && visible.length === 0 ? (
          <EmptyState
            icon={<Package size={40} color={colors.brand.primary} strokeWidth={1.6} />}
            title={t('catalog.productsList.emptyTitle')}
            description={t('catalog.productsList.emptyDescription')}
            actionLabel={t('billing.addProduct')}
            onAction={() => navigation.navigate('AddProduct')}
          />
        ) : <View style={{ flex: 1, marginHorizontal: spacing.lg }}><DataTable columns={columns} data={visible} keyExtractor={(item) => item.id} onEndReached={loadMore} refreshing={isRefetching} onRefresh={refetch} estimatedItemSize={64} onRowPress={(item) => navigation.navigate('ProductDetail', { productId: item.id })} /></View>}

        <View style={{ position: 'absolute', bottom: 16, right: spacing.lg }}>
          <PulseFab onPress={() => navigation.navigate('AddProduct')} icon={<Plus size={22} color={colors.ink.primary} strokeWidth={2} />} />
        </View>
      </SafeAreaView>
      <BottomNav active="products" />
      <BarcodeScanner visible={scanning} onClose={() => setScanning(false)} onScan={scan} />
      <BarcodeUnknown code={unknown} onClose={() => setUnknown(null)} onLinked={scan} />
    </AnimatedScreen>
  );
}
