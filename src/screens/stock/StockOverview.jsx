import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Boxes, AlertTriangle, ArrowUpCircle, ArrowDownCircle, PackageOpen, Plus, Search, Package } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { PulseFab } from '../../components/motion/PulseFab';
import { Header } from '../../components/ui/Header';
import { StatCard } from '../../components/ui/StatCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { SkeletonListRow } from '../../components/ui/Skeleton';
import { useTheme } from '../../theme';
import { useStockOverview, useStockTransactions } from '../../hooks/useStock';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function StockOverview() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const [filter, setFilter] = useState('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  const { totalSkus, lowStockCount } = useStockOverview();
  const { data: transactions = [], isLoading, isRefetching, refetch } = useStockTransactions();

  const FILTERS = [
    { key: 'all', label: t('stock.overview.filterAll') },
    { key: 'IN', label: t('stock.overview.filterStockIn') },
    { key: 'OUT', label: t('stock.overview.filterStockOut') },
    { key: 'PACK_BREAK', label: t('stock.overview.filterPackBreak') },
  ];

  const TYPE_META = {
    IN: { icon: ArrowUpCircle, tone: 'success', label: t('stock.overview.filterStockIn') },
    OUT: { icon: ArrowDownCircle, tone: 'danger', label: t('stock.overview.filterStockOut') },
    PACK_BREAK: { icon: PackageOpen, tone: 'warning', label: t('stock.overview.filterPackBreak') },
  };

  const visible = filter === 'all' ? transactions : transactions.filter((tx) => tx.type === filter);

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('nav.stock')} showBack={false} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
            <StatCard
              icon={<Boxes size={18} color={colors.brand.primary} />}
              value={String(totalSkus)}
              label={t('stock.overview.totalSkus')}
            />
            <StatCard
              icon={<AlertTriangle size={18} color={colors.semantic.warning} />}
              value={String(lowStockCount)}
              label={t('stock.overview.lowStock')}
              tone={lowStockCount > 0 ? 'danger' : 'primary'}
            />
          </View>

          <View>
            <SectionHeader title={t('stock.overview.transactionHistory')} />
            <View style={{ flexDirection: rowDirection, gap: spacing.sm, flexWrap: 'wrap' }}>
              {FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={{ padding: spacing.lg }}>
            <SkeletonListRow />
            <SkeletonListRow />
            <SkeletonListRow />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Package size={40} color={colors.brand.primary} strokeWidth={1.6} />}
            title={t('stock.overview.emptyTitle')}
            description={t('stock.overview.emptyDescription')}
            actionLabel={t('stock.overview.adjustStock')}
            onAction={() => setPickerOpen(true)}
          />
        ) : (
          <StaggeredList
            data={visible}
            estimatedItemSize={72}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 96 }}
            renderItem={({ item }) => {
              const meta = TYPE_META[item.type] || TYPE_META.IN;
              const Icon = meta.icon;
              const signed = item.type === 'OUT' ? `-${item.quantity}` : `+${item.quantity}`;
              return (
                <View
                  style={{
                    flexDirection: rowDirection,
                    alignItems: 'center',
                    gap: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.surface.border,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radii.md,
                      backgroundColor: colors.semantic[`${meta.tone}Bg`],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color={colors.semantic[meta.tone]} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary }]} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={[typography.caption, { color: colors.ink.secondary }]} numberOfLines={1}>
                      {item.description || meta.label} · {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[typography.numeric, { color: item.type === 'OUT' ? colors.semantic.danger : colors.semantic.success }]}>
                      {signed}
                    </Text>
                    {item.price ? (
                      <Text style={[typography.caption, { color: colors.ink.secondary }]}>{formatCurrency(item.price)}</Text>
                    ) : (
                      <Badge label={meta.label} tone={meta.tone} />
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
          <PulseFab
            onPress={() => setPickerOpen(true)}
            icon={<Plus size={22} color={colors.ink.primary} strokeWidth={1.8} />}
          />
        </View>
      </SafeAreaView>

      <ProductPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(product) => {
          setPickerOpen(false);
          navigation.navigate('StockAdjustment', { productId: product.id });
        }}
      />
    </AnimatedScreen>
  );
}

function ProductPickerSheet({ visible, onClose, onPick }) {
  const { colors, radii, typography, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const { data: products = [] } = useProducts({ search });
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  return (
    <Sheet visible={visible} onClose={onClose} title={t('stock.overview.pickerTitle')}>
      <View
        style={{
          height: 42,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.surface.border,
          flexDirection: rowDirection,
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Search size={15} color={colors.ink.secondary} strokeWidth={1.6} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('billing.searchProducts')}
          placeholderTextColor={colors.ink.secondary}
          style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign }]}
        />
      </View>

      {products.map((product) => (
        <Pressable
          key={product.id}
          onPress={() => onPick(product)}
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.surface.border,
          }}
        >
          <View style={{ width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.surface.border }} />
          <Text style={[typography.body, { color: colors.ink.primary, flex: 1 }]} numberOfLines={1}>
            {product.name}
          </Text>
        </Pressable>
      ))}

      {products.length === 0 ? (
        <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center', paddingVertical: spacing.lg }]}>
          {t('stock.overview.noProductsMatch')}
        </Text>
      ) : null}
    </Sheet>
  );
}
