import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Boxes, Package, Pencil, Ruler, ScanLine, SlidersHorizontal } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency } from '../../utils/money';
import { formatStockLabel, isLowStock, isOutOfStock } from '../../utils/stock';
import { useT, useIsUrdu } from '../../store/languageStore';

const ICONS = { QUANTITY: Package, PACK: Boxes, LENGTH: Ruler, AREA: ScanLine };

export default function ProductDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { data: product } = useProduct(route.params?.productId);
  const { data: categories = [] } = useCategories();
  if (!product) return null;
  const Icon = ICONS[product.stockType] || Package;
  const category = categories.find((item) => item.id === product.categoryId);
  const out = isOutOfStock(product);
  const low = !out && isLowStock(product);
  const row = (label, value, accent) => <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: spacing.md }}><Text style={[typography.body, { flex: 1, color: colors.ink.secondary, textAlign: align }]}>{label}</Text><Text style={[typography.bodyMedium, { color: accent || colors.ink.primary, textAlign: isUrdu ? 'left' : 'right' }]}>{value}</Text></View>;

  return <AnimatedScreen><SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}><Header title={t('catalog.productDetail.title')} onBack={() => navigation.goBack()} right={<Button title={t('common.edit')} variant="ghost" icon={<Pencil size={16} color={colors.brand.primary} />} onPress={() => navigation.navigate('EditProduct', { productId: product.id })} style={{ minHeight: 38, paddingHorizontal: spacing.sm }} />} /><ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}><View style={{ alignItems: 'center', gap: spacing.sm }}>{product.image ? <Image source={{ uri: product.image }} style={{ width: 96, height: 96, borderRadius: radii.xl }} /> : <View style={{ width: 96, height: 96, borderRadius: radii.xl, backgroundColor: colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}><Icon size={40} color={colors.brand.primary} /></View>}<Text style={[typography.h1, { color: colors.ink.primary, textAlign: 'center' }]}>{product.name}</Text><View style={{ flexDirection: direction, gap: spacing.sm }}><Badge label={t(`catalog.productDetail.mode.${product.stockType.toLowerCase()}`)} tone="brand" /><Badge label={out ? t('catalog.productsList.outOfStock') : low ? t('catalog.productsList.filterLowStock') : t('catalog.productDetail.inStock')} tone={out ? 'danger' : low ? 'warning' : 'success'} /></View></View><Card style={{ gap: spacing.md }}>{row(t('catalog.productDetail.currentStock'), formatStockLabel(product), out ? colors.semantic.danger : low ? colors.semantic.warning : colors.semantic.success)}{row(t('catalog.addProduct.category'), category?.name || t('catalog.productDetail.uncategorized'))}{row(t('catalog.addProduct.purchasePrice'), formatCurrency(product.purchasePrice))}{row(t('catalog.addProduct.salePrice'), formatCurrency(product.salePrice))}{product.lowStockThreshold != null ? row(t('catalog.addProduct.lowStockThresholdOptional'), String(product.lowStockThreshold)) : null}{product.stockType === 'PACK' ? <>{row(t('catalog.addProduct.unitsPerPack'), String(product.packSize || 0))}{row(t('catalog.addProduct.packPurchasePriceOptional'), product.packPurchasePrice == null ? '—' : formatCurrency(product.packPurchasePrice))}{row(t('catalog.addProduct.packSalePriceOptional'), product.packSalePrice == null ? '—' : formatCurrency(product.packSalePrice))}</> : null}</Card><Button title={t('common.edit')} icon={<Pencil size={17} color={colors.ink.onBrand} />} onPress={() => navigation.navigate('EditProduct', { productId: product.id })} /><Button title={t('catalog.productDetail.adjustStock')} variant="outline" icon={<SlidersHorizontal size={17} color={colors.brand.primary} />} onPress={() => navigation.navigate('StockAdjustment', { productId: product.id })} /></ScrollView></SafeAreaView></AnimatedScreen>;
}
