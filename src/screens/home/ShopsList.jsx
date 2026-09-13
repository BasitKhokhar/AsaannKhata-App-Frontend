import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../theme';
import { useShops } from '../../hooks/useShops';
import { useShopStore } from '../../store/shopStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function ShopsList() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: shops = [], isLoading } = useShops();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const setActiveShopId = useShopStore((s) => s.setActiveShopId);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.md, textAlign: isUrdu ? 'right' : 'left' }]}>
          {t('nav.myShops')}
        </Text>

        <FlatList
          data={shops}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.xl }]}>
                {t('home.shopsList.emptyTitle')}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const active = String(item.id) === String(activeShopId);
            return (
              <Pressable
                onPress={() => setActiveShopId(String(item.id))}
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: spacing.md,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: active ? 1.5 : 1,
                  borderColor: active ? colors.brand.primary : colors.surface.border,
                  backgroundColor: active ? colors.brand.primary + '14' : 'transparent',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: radii.md, overflow: 'hidden' }}>
                  <LinearGradient colors={colors.gradient.primary} style={{ flex: 1 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{item.name}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }]}>
                    {item.shopTypeCode || t('home.shopsList.defaultShopType')} {item.address ? `· ${item.address}` : ''}
                  </Text>
                </View>
                {active ? <Badge label={t('home.shopsList.active')} tone="brand" /> : null}
              </Pressable>
            );
          }}
        />

        <View style={{ padding: spacing.lg }}>
          <Pressable
            onPress={() => navigation.navigate('AddShop')}
            style={{
              height: 48,
              borderRadius: radii.lg,
              borderWidth: 1.5,
              borderColor: colors.brand.primary,
              borderStyle: 'dashed',
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M8 2v12M2 8h12" stroke={colors.brand.primary} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
            <Text style={[typography.h3, { color: colors.brand.primary }]}>{t('home.shopsList.addShop')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
