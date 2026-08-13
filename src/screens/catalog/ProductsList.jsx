import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { PulseFab } from '../../components/motion/PulseFab';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
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
  const { colors, radii, typography, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: products = [], isLoading } = useProducts({ search });

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
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Svg width={15} height={15} viewBox="0 0 16 16">
              <Circle cx={6.5} cy={6.5} r={4.5} fill="none" stroke={colors.ink.secondary} strokeWidth={1.4} />
              <Line x1={10} y1={10} x2={14} y2={14} stroke={colors.ink.secondary} strokeWidth={1.4} />
            </Svg>
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
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.pill,
                  backgroundColor: active ? colors.brand.primary : 'transparent',
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.surface.border,
                }}
              >
                <Text style={[typography.label, { color: active ? '#FAF9F6' : colors.ink.secondary }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!isLoading && visible.length === 0 ? (
          <EmptyState
            icon={
              <Svg width={40} height={40} viewBox="0 0 24 24">
                <Path d="M4 8l8-5 8 5-8 5-8-5z" fill="none" stroke={colors.brand.primary} strokeWidth={1.6} strokeLinejoin="round" />
                <Path d="M4 8v9l8 5 8-5V8" fill="none" stroke={colors.brand.primary} strokeWidth={1.6} strokeLinejoin="round" />
              </Svg>
            }
            title="No products yet"
            description="Add your first product to start billing customers and tracking stock."
            actionLabel="Add Product"
            onAction={() => navigation.navigate('AddProduct')}
          />
        ) : (
          <StaggeredList
            data={visible}
            estimatedItemSize={68}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
            renderItem={({ item }) => {
              const outOfStock = isOutOfStock(item);
              const low = !outOfStock && isLowStock(item);
              return (
                <Pressable
                  onPress={() => navigation.navigate('StockAdjustment', { productId: item.id })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.surface.border,
                    borderRadius: radii.md,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: radii.sm, backgroundColor: colors.surface.border }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{item.name}</Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: outOfStock ? colors.semantic.danger : low ? colors.semantic.warning : colors.ink.secondary, fontWeight: low || outOfStock ? '700' : '400' },
                      ]}
                    >
                      {outOfStock ? 'Out of stock' : formatStockLabel(item)}
                    </Text>
                  </View>
                  <Badge label={MODE_BADGE[item.stockType] || 'QTY'} tone={item.stockType === 'AREA' || item.stockType === 'PACK' ? 'warning' : 'brand'} />
                </Pressable>
              );
            }}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
          <PulseFab
            onPress={() => navigation.navigate('AddProduct')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 16 16">
                <Path d="M8 2v12M2 8h12" stroke={colors.ink.primary} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
