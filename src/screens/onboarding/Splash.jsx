import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { AmbientGlow } from '../../components/motion/AmbientGlow';
import { Shimmer } from '../../components/motion/Shimmer';
import { DotGlowLoader } from '../../components/motion/DotGlowLoader';
import { Logo } from '../../components/ui/Logo';
import { useTheme } from '../../theme';
import { onBrandAlpha } from '../../theme/colors';

const AUTO_ADVANCE_MS = 1800;

export default function Splash() {
  const navigation = useNavigation();
  const { colors, typography, spacing, radii } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <GradientShiftBackground colors={colors.gradient.header}>
      <View style={styles.center}>
        <View style={styles.glowWrap}>
          <AmbientGlow color={colors.brand.accent} size={130} />
          <FloatingIconCluster>
            <View style={[styles.badgeShadow, { shadowColor: colors.brand.accent }]}>
              <View style={[styles.badge, { borderRadius: radii.xl, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Logo size={60} color={colors.ink.onBrand} accentColor={colors.brand.accent} />
                <Shimmer parentWidth={96} />
              </View>
            </View>
          </FloatingIconCluster>
        </View>

        <Text style={[typography.h1, { color: colors.ink.onBrand, marginTop: spacing.lg }]}>AsaanKhata</Text>
        <Text
          style={[
            typography.label,
            {
              color: onBrandAlpha(0.6),
              marginTop: spacing.xs,
              letterSpacing: 2,
              textTransform: 'uppercase',
            },
          ]}
        >
          Every Shop. One App.
        </Text>
      </View>

      <View style={styles.loaderWrap}>
        <DotGlowLoader color={colors.brand.accent} />
      </View>
    </GradientShiftBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loaderWrap: { alignItems: 'center', paddingBottom: 48 },
});
