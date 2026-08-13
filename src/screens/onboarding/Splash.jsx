import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { DotGlowLoader } from '../../components/motion/DotGlowLoader';
import { Logo } from '../../components/ui/Logo';
import { useTheme } from '../../theme';

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
        <FloatingIconCluster>
          <View
            style={[
              styles.badge,
              { borderRadius: radii.xl, backgroundColor: 'rgba(255,255,255,0.1)', shadowColor: colors.brand.accent },
            ]}
          >
            <Logo size={60} color="#FAF9F6" accentColor={colors.brand.accent} />
          </View>
        </FloatingIconCluster>

        <Text style={[typography.h1, { color: '#FAF9F6', marginTop: spacing.lg }]}>AsaanKhata</Text>
        <Text
          style={[
            typography.label,
            {
              color: 'rgba(250,249,246,0.6)',
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
  badge: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  loaderWrap: { alignItems: 'center', paddingBottom: 48 },
});
