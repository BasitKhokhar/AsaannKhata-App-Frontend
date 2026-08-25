import React, { useState } from 'react';
import { View, Text, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus, Package } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { PulseFab } from '../../components/motion/PulseFab';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { ListRow } from '../../components/ui/ListRow';
import { SubscriptionBanner } from '../../components/ui/SubscriptionBanner';
import { useTheme } from '../../theme';
import { useProducts } from '../../hooks/useProducts';
import { formatStockLabel, isLowStock, isOutOfStock } from '../../utils/stock';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low stock' },
];

const MODE_BADGE = { QUANTITY: 'QTY', AREA: 'AREA', LENGTH: 'LENGTH', PACK: 'PACK' };

export default function ProductsList() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: products = [], isLoading, isRefetching, refetch } = useProducts({ search });

  const visible = filter === 'low' ? products.filter((p) => isLowStock(p) || isOutOfStock(p)) : products;

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Products</Text>
        <SubscriptionBanner />

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              height: 42,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.surface.border,
              backgroundColor: colors.surface.card,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Search size={16} color={colors.ink.secondary} strokeWidth={1.8} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products"
              placeholderTextColor={colors.ink.secondary}
              style={[typography.body, { flex: 1, color: colors.ink.primary }]}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>

        {!isLoading && visible.length === 0 ? (
          <EmptyState
            icon={<Package size={40} color={colors.brand.primary} strokeWidth={1.6} />}
            title="No products yet"
            description="Add your first product to start billing customers and tracking stock."
            actionLabel="Add Product"
            onAction={() => navigation.navigate('AddProduct')}
          />
        ) : (
          <StaggeredList
            data={visible}
            estimatedItemSize={68}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
            renderItem={({ item }) => {
              const outOfStock = isOutOfStock(item);
              const low = !outOfStock && isLowStock(item);
              return (
                <ListRow
                  onPress={() => navigation.navigate('StockAdjustment', { productId: item.id })}
                  style={[
                    {
                      backgroundColor: colors.surface.card,
                      borderWidth: 1,
                      borderColor: colors.surface.border,
                      marginBottom: spacing.sm,
                      paddingVertical: spacing.sm,
                    },
                    elevation.xs,
                  ]}
                  leading={
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radii.sm,
                        backgroundColor: colors.surface.raised,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                      ) : (
                        <Package size={18} color={colors.ink.secondary} strokeWidth={1.6} />
                      )}
                    </View>
                  }
                  title={item.name}
                  subtitle={
                    <Text
                      style={{
                        color: outOfStock ? colors.semantic.danger : low ? colors.semantic.warning : colors.ink.secondary,
                        fontWeight: low || outOfStock ? '700' : '400',
                      }}
                    >
                      {outOfStock ? 'Out of stock' : formatStockLabel(item)}
                    </Text>
                  }
                  trailing={<Badge label={MODE_BADGE[item.stockType] || 'QTY'} tone={item.stockType === 'AREA' || item.stockType === 'PACK' ? 'warning' : 'brand'} />}
                />
              );
            }}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
          <PulseFab onPress={() => navigation.navigate('AddProduct')} icon={<Plus size={22} color={colors.ink.primary} strokeWidth={2} />} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
