import React, { useEffect } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boxes, ShoppingBag, Users, ChartNoAxesCombined, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { AmbientGlow } from '../../components/motion/AmbientGlow';
import { Shimmer } from '../../components/motion/Shimmer';
import { DotGlowLoader } from '../../components/motion/DotGlowLoader';
import { useTheme } from '../../theme';
import { onBrandAlpha } from '../../theme/colors';
import { useT } from '../../store/languageStore';

const AUTO_ADVANCE_MS = 1800;

export default function Splash() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const t = useT();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <GradientShiftBackground colors={colors.gradient.header}>
      <View style={styles.logoAnchor}>
        <View style={styles.glowWrap}>
          <AmbientGlow color={colors.brand.accent} size={130} />
          <FloatingIconCluster>
            <View style={[styles.badgeShadow, { shadowColor: colors.brand.accent }]}>
              <View style={styles.badge}>
                <Image source={require('../../../assets/splash-icon.png')} style={styles.splashLogo} resizeMode="contain" />
                <Shimmer parentWidth={96} />
              </View>
            </View>
          </FloatingIconCluster>
        </View>
      </View>

      <View style={styles.brandCopy}>
        <Text style={[typography.h1, { color: colors.ink.onBrand, marginTop: spacing.lg }]}>AsaanDukaan</Text>
        <Text
          style={[
            typography.label,
            {
              color: onBrandAlpha(0.6),
              marginTop: spacing.xs,
              letterSpacing: 2,
              textTransform: 'uppercase',
              textAlign: 'center',
            },
          ]}
        >
          {t('onboarding.splashTagline')}
        </Text>
      </View>

      <SafeAreaView edges={['bottom']} style={[styles.bottomFeatures, { gap: spacing.xl, paddingHorizontal: spacing.lg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          {[
            { icon: Boxes, label: t('onboarding.splashInventory') },
            { icon: ShoppingBag, label: t('nav.sales') },
            { icon: Users, label: t('dashboard.customersCount') },
            { icon: ChartNoAxesCombined, label: t('nav.reports') },
            { icon: TrendingUp, label: t('onboarding.splashGrow') },
          ].map((item) => (
            <View key={item.label} style={{ alignItems: 'center', gap: spacing.xs }}>
              <item.icon size={17} color={colors.ink.onBrand} strokeWidth={1.5} />
              <Text style={[typography.label, { color: onBrandAlpha(0.85), fontSize: 10 }]}>{item.label}</Text>
            </View>
          ))}
        </View>
        <DotGlowLoader color={colors.brand.accent} />
      </SafeAreaView>
    </GradientShiftBackground>
  );
}

const styles = StyleSheet.create({
  logoAnchor: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  brandCopy: { position: 'absolute', top: '50%', left: 0, right: 0, marginTop: 70, alignItems: 'center' },
  bottomFeatures: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  glowWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  badgeShadow: {
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  badge: {
    width: 96,
    height: 96,
    overflow: 'hidden',
  },
  splashLogo: { width: 96, height: 96 },
});
