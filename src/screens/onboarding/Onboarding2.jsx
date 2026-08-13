import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Rect, Line } from 'react-native-svg';
import { OnboardingSlide } from './OnboardingSlide';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { useTheme } from '../../theme';

function ModeTile({ tone, label, children }) {
  const { colors, radii, typography, spacing } = useTheme();
  const bg = tone === 'gold' ? colors.brand.accentLight + '59' : colors.brand.primary + '26';
  const fg = tone === 'gold' ? colors.brand.accentDark : colors.brand.primary;

  return (
    <View style={{ width: 60, height: 76, borderRadius: radii.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
      {children}
      <Text style={[typography.label, { color: fg, fontSize: 9 }]}>{label}</Text>
    </View>
  );
}

export default function Onboarding2() {
  const { colors, spacing } = useTheme();
  const navyIcon = colors.brand.primary;
  const goldIcon = colors.brand.accentDark;

  return (
    <OnboardingSlide
      index={1}
      nextRoute="Onboarding3"
      title={'Track quantity, area, length,\nor packs — your way'}
      description="Set the stock mode once per shop. Billing and inventory adapt automatically."
      illustration={
        <FloatingIconCluster delay={150}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ModeTile tone="navy" label="QTY">
              <Svg width={20} height={20}>
                <Circle cx={6} cy={10} r={3} fill={navyIcon} />
                <Circle cx={14} cy={10} r={3} fill={navyIcon} />
              </Svg>
            </ModeTile>
            <ModeTile tone="gold" label="AREA">
              <Svg width={20} height={16} viewBox="0 0 20 16">
                <Rect x={1} y={1} width={18} height={14} fill="none" stroke={goldIcon} strokeWidth={1.4} />
              </Svg>
            </ModeTile>
            <ModeTile tone="navy" label="LENGTH">
              <Svg width={24} height={8} viewBox="0 0 24 8">
                <Line x1={1} y1={4} x2={23} y2={4} stroke={navyIcon} strokeWidth={1.6} />
                <Line x1={1} y1={1} x2={1} y2={7} stroke={navyIcon} strokeWidth={1.6} />
                <Line x1={23} y1={1} x2={23} y2={7} stroke={navyIcon} strokeWidth={1.6} />
              </Svg>
            </ModeTile>
            <ModeTile tone="gold" label="PACK">
              <Svg width={20} height={18} viewBox="0 0 20 18">
                <Rect x={1} y={1} width={18} height={16} fill="none" stroke={goldIcon} strokeWidth={1.4} />
                <Line x1={1} y1={6} x2={19} y2={6} stroke={goldIcon} strokeWidth={1.2} />
              </Svg>
            </ModeTile>
          </View>
        </FloatingIconCluster>
      }
    />
  );
}
