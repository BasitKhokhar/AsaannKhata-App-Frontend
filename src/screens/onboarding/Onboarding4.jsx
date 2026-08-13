import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OnboardingSlide } from './OnboardingSlide';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { useTheme } from '../../theme';

export default function Onboarding4() {
  const { colors, radii, spacing } = useTheme();

  return (
    <OnboardingSlide
      index={3}
      isLast
      title={'Work offline, sync\nacross your devices'}
      description="Every shop works without internet, and syncs the moment you're back online."
      illustration={
        <FloatingIconCluster delay={100}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 44, height: 64, borderRadius: radii.sm, backgroundColor: colors.brand.primary + '26', borderWidth: 2, borderColor: colors.brand.primary }} />
            <Svg width={28} height={16} viewBox="0 0 28 16">
              <Path
                d="M1 8h26M20 2l6 6-6 6"
                stroke={colors.brand.accentDark}
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 3"
              />
            </Svg>
            <View style={{ width: 44, height: 64, borderRadius: radii.sm, backgroundColor: colors.brand.primary + '26', borderWidth: 2, borderColor: colors.brand.primary }} />
          </View>
        </FloatingIconCluster>
      }
    />
  );
}
