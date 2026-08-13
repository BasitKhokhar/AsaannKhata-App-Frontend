import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { OnboardingSlide } from './OnboardingSlide';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { IconTile } from '../../components/ui/IconTile';
import { useTheme } from '../../theme';

export default function Onboarding1() {
  const { colors, spacing } = useTheme();
  const navyIcon = colors.brand.primary;
  const goldIcon = colors.brand.accent;

  return (
    <OnboardingSlide
      index={0}
      nextRoute="Onboarding2"
      title={'Run every kind of shop,\none app'}
      description="General stores, pharmacies, hardware, boutiques — AsaanKhata adapts to your business."
      illustration={
        <FloatingIconCluster>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 64 * 2 + spacing.md, gap: spacing.md }}>
            <IconTile tone="navy">
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M4 21V9l8-5 8 5v12h-5v-7H9v7z" fill="none" stroke={navyIcon} strokeWidth={1.6} strokeLinejoin="round" />
              </Svg>
            </IconTile>
            <IconTile tone="gold">
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M9 3h6v5h5v13H4V8h5z" fill="none" stroke={goldIcon} strokeWidth={1.6} strokeLinejoin="round" />
                <Path d="M12 8v6M9 11h6" stroke={goldIcon} strokeWidth={1.6} />
              </Svg>
            </IconTile>
            <IconTile tone="navy">
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Rect x={4} y={4} width={16} height={16} fill="none" stroke={navyIcon} strokeWidth={1.6} />
                <Line x1={4} y1={4} x2={20} y2={20} stroke={navyIcon} strokeWidth={1.6} />
              </Svg>
            </IconTile>
            <IconTile tone="gold">
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" fill="none" stroke={goldIcon} strokeWidth={1.6} />
                <Path d="M12 4v16M4 12h16" stroke={goldIcon} strokeWidth={1.2} />
              </Svg>
            </IconTile>
          </View>
        </FloatingIconCluster>
      }
    />
  );
}
