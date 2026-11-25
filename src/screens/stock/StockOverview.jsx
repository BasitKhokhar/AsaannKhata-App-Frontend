import React, { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes, Eye, History, Package, Plus, Search, SlidersHorizontal } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { PulseFab } from '../../components/motion/PulseFab';
import { Header } from '../../components/ui/Header';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Sheet } from '../../components/ui/Sheet';
import { SkeletonListRow } from '../../components/ui/Skeleton';
import { useTheme } from '../../theme';
import { useStockOverview, useStockTransactions } from '../../hooks/useStock';
import { useProductPages } from '../../hooks/useProducts';
import { formatStockLabel, isLowStock, isOutOfStock } from '../../utils/stock';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function StockOverview() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const { totalSkus, lowStockCount } = useStockOverview();
  const productsQuery = useProductPages({ search, lowStock: filter === 'low', outOfStock: filter === 'out' });
  const history = useStockTransactions('all');
  const filters = [
    { key: 'all', label: t('stock.overview.filterAll') },
    { key: 'low', label: t('catalog.productsList.filterLowStock') },
    { key: 'out', label: t('catalog.productsList.outOfStock') },
  ];
  const columns = [
    { key: 'product', label: t('stock.overview.product'), width: 190, render: (item) => <StockProductCell product={item} /> },
    { key: 'stock', label: t('stock.overview.stock'), width: 116, render: (item) => formatStockLabel(item) },
    { key: 'price', label: t('stock.overview.salePrice'), width: 88, render: (item) => formatCurrency(displaySalePrice(item)) },
    { key: 'status', label: t('stock.overview.status'), width: 92, align: 'center', render: (item) => { const out = isOutOfStock(item); const low = !out && isLowStock(item); return <Badge label={out ? t('catalog.productsList.outOfStock') : low ? t('catalog.productsList.filterLowStock') : t('catalog.productDetail.inStock')} tone={out ? 'danger' : low ? 'warning' : 'success'} />; } },
    { key: 'actions', label: t('records.actions'), width: 92, align: 'center', render: (item) => <View style={{ flexDirection: rowDirection }}><IconButton icon={Eye} size={17} color={colors.brand.primary} onPress={() => navigation.navigate('CatalogStack', { screen: 'ProductDetail', params: { productId: item.id } })} accessibilityLabel={t('stock.overview.details')} /><IconButton icon={SlidersHorizontal} size={17} color={colors.brand.primary} onPress={() => navigation.navigate('StockAdjustment', { productId: item.id })} accessibilityLabel={t('stock.overview.adjust')} /></View> },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={showHistory ? t('stock.overview.transactionHistory') : t('nav.stock')} right={<Button title={showHistory ? t('stock.overview.inventory') : t('stock.overview.viewHistory')} variant="ghost" compact icon={showHistory ? <Boxes size={16} color={colors.brand.primary} /> : <History size={16} color={colors.brand.primary} />} onPress={() => setShowHistory((value) => !value)} style={{ paddingHorizontal: spacing.xs, minHeight: 38 }} />} />
        {showHistory ? <HistoryList history={history} /> : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
                <CompactMetric icon={<Boxes size={15} color={colors.brand.primary} />} value={totalSkus} label={t('stock.overview.totalSkus')} />
                <CompactMetric icon={<AlertTriangle size={15} color={lowStockCount > 0 ? colors.semantic.danger : colors.semantic.warning} />} value={lowStockCount} label={t('stock.overview.lowStock')} danger={lowStockCount > 0} />
              </View>
              <View style={{ height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.card, flexDirection: rowDirection, alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm }}>
                <Search size={16} color={colors.ink.secondary} strokeWidth={1.8} />
                <TextInput value={search} onChangeText={setSearch} placeholder={t('billing.searchProducts')} placeholderTextColor={colors.ink.secondary} style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign }]} />
              </View>
              <View style={{ flexDirection: rowDirection, gap: spacing.sm, flexWrap: 'wrap' }}>{filters.map((item) => <Chip key={item.key} label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />)}</View>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }}><SectionHeader title={t('stock.overview.inventoryTitle')} /><Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('stock.overview.pageSize')}</Text></View>
            </View>
            {productsQuery.isLoading ? <LoadingRows /> : productsQuery.rows.length === 0 ? <EmptyState icon={<Package size={40} color={colors.brand.primary} strokeWidth={1.6} />} title={t('stock.overview.emptyInventoryTitle')} description={t('stock.overview.emptyInventoryDescription')} actionLabel={t('billing.addProduct')} onAction={() => navigation.navigate('CatalogStack', { screen: 'AddProduct' })} /> : <View style={{ flex: 1, marginHorizontal: spacing.lg }}><DataTable columns={columns} data={productsQuery.rows} keyExtractor={(item) => item.id} refreshing={productsQuery.isRefetching} onRefresh={productsQuery.refetch} onEndReached={productsQuery.loadMore} estimatedItemSize={64} /></View>}
            <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}><PulseFab onPress={() => setPickerOpen(true)} icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />} /></View>
          </>
        )}
      </SafeAreaView>
      <ProductPickerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(product) => { setPickerOpen(false); navigation.navigate('StockAdjustment', { productId: product.id }); }} />
    </AnimatedScreen>
  );
}

function StockProductCell({ product }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isUrdu = useIsUrdu();
  const imageUri = product.imageLocalUri || product.imageRemoteUrl;
  return <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}><View style={{ width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{imageUri ? <Image source={{ uri: imageUri }} style={{ width: 34, height: 34 }} resizeMode="cover" /> : <Package size={17} color={colors.ink.secondary} />}</View><Text numberOfLines={1} style={[typography.bodyMedium, { flex: 1, color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{product.name}</Text></View>;
}

function displaySalePrice(product) {
  if (product.stockType === 'PACK') return product.packSalePrice ?? product.salePrice * (product.packSize || 1);
  if (product.stockType === 'LIQUID') return product.salePrice * 1000;
  return product.salePrice;
}

function CompactMetric({ icon, value, label, danger }) {
  const { colors, radii, typography, spacing } = useTheme();
  return <View style={{ flex: 1, minHeight: 54, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.card, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}><View style={{ width: 26, height: 26, borderRadius: radii.sm, backgroundColor: danger ? colors.semantic.dangerBg : colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}>{icon}</View><View><Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{value}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{label}</Text></View></View>;
}

function LoadingRows() { return <View style={{ padding: 16 }}><SkeletonListRow /><SkeletonListRow /><SkeletonListRow /></View>; }

function HistoryList({ history }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const transactions = history.data || [];
  if (history.isLoading) return <LoadingRows />;
  if (!transactions.length) return <EmptyState icon={<History size={40} color={colors.brand.primary} strokeWidth={1.6} />} title={t('stock.overview.emptyTitle')} description={t('stock.overview.emptyDescription')} />;
  return <StaggeredList data={transactions} estimatedItemSize={72} refreshing={history.isRefetching} onRefresh={history.refetch} onEndReached={() => { if (history.hasNextPage && !history.isFetchingNextPage) history.fetchNextPage(); }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }} renderItem={({ item }) => { const isOut = item.type === 'OUT'; const isPackBreak = item.type === 'PACK_BREAK'; const Icon = isOut ? ArrowDownCircle : isPackBreak ? Boxes : ArrowUpCircle; const tone = isOut ? colors.semantic.danger : isPackBreak ? colors.semantic.warning : colors.semantic.success; const label = isOut ? t('stock.overview.filterStockOut') : isPackBreak ? t('stock.overview.filterPackBreak') : t('stock.overview.filterStockIn'); return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm }}><Icon size={20} color={tone} /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: colors.ink.primary }]} numberOfLines={1}>{item.productName}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]} numberOfLines={1}>{item.description || label} · {formatRelativeTime(item.createdAt)}</Text></View><Text style={[typography.numeric, { color: tone }]}>{isOut ? '-' : '+'}{item.quantity}</Text></View>; }} />;
}

function ProductPickerSheet({ visible, onClose, onPick }) {
  const { colors, radii, typography, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const { rows: products } = useProductPages({ search });
  const t = useT();
  return <Sheet visible={visible} onClose={onClose} title={t('stock.overview.pickerTitle')}><View style={{ height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm }}><Search size={15} color={colors.ink.secondary} /><TextInput value={search} onChangeText={setSearch} placeholder={t('billing.searchProducts')} placeholderTextColor={colors.ink.secondary} style={[typography.body, { flex: 1, color: colors.ink.primary }]} /></View>{products.slice(0, 20).map((product) => <Button key={product.id} title={product.name} variant="ghost" compact onPress={() => onPick(product)} style={{ justifyContent: 'flex-start' }} />)}</Sheet>;
}
