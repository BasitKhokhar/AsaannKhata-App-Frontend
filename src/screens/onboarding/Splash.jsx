import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { AmbientGlow } from '../../components/motion/AmbientGlow';
import { Shimmer } from '../../components/motion/Shimmer';
import { DotGlowLoader } from '../../components/motion/DotGlowLoader';
import { Logo } from '../../components/ui/Logo';
import { useTheme } from '../../theme';
import { onBrandAlpha } from '../../theme/colors';
import { useT } from '../../store/languageStore';

const AUTO_ADVANCE_MS = 1800;

export default function Splash() {
  const navigation = useNavigation();
  const { colors, typography, spacing, radii } = useTheme();
  const t = useT();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <GradientShiftBackground colors={colors.gradient.header}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.glowWrap}>
            <AmbientGlow color={colors.brand.accent} size={190} />
            <View style={[styles.outerRing, { borderColor: onBrandAlpha(0.12) }]} />
            <View style={[styles.innerRing, { borderColor: onBrandAlpha(0.2) }]} />
            <FloatingIconCluster distance={7}>
              <View style={[styles.badgeShadow, { shadowColor: colors.brand.accent }]}>
                <View
                  style={[
                    styles.badge,
                    {
                      borderRadius: radii.xl,
                      backgroundColor: onBrandAlpha(0.12),
                      borderColor: onBrandAlpha(0.22),
                    },
                  ]}
                >
                  <Logo size={66} color={colors.ink.onBrand} accentColor={colors.brand.accent} />
                  <Shimmer parentWidth={108} />
                </View>
              </View>
            </FloatingIconCluster>
          </View>

          <Text style={[typography.display, styles.wordmark, { color: colors.ink.onBrand, marginTop: spacing.xl }]}>AsaanKhata</Text>
          <View style={[styles.wordmarkRule, { marginTop: spacing.sm }]}>
            <View style={[styles.rule, { backgroundColor: onBrandAlpha(0.24) }]} />
            <View style={[styles.ruleDot, { backgroundColor: colors.brand.accent }]} />
            <View style={[styles.rule, { backgroundColor: onBrandAlpha(0.24) }]} />
          </View>
          <Text
            style={[
              typography.label,
              styles.tagline,
              {
                color: onBrandAlpha(0.72),
                marginTop: spacing.sm,
              },
            ]}
          >
            {t('onboarding.splashTagline')}
          </Text>
        </View>

        <View style={[styles.loader, { paddingBottom: spacing.lg }]}>
          <DotGlowLoader color={colors.brand.accent} size={7} />
        </View>
      </SafeAreaView>
    </GradientShiftBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 176, height: 176, borderRadius: 88, borderWidth: 1 },
  innerRing: { position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 1 },
  badgeShadow: {
    shadowOpacity: 0.36,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  badge: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  wordmark: { letterSpacing: -0.8 },
  wordmarkRule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { width: 30, height: 1 },
  ruleDot: { width: 5, height: 5, borderRadius: 3 },
  tagline: { letterSpacing: 2.2, textTransform: 'uppercase', textAlign: 'center' },
  loader: { alignItems: 'center' },
});
