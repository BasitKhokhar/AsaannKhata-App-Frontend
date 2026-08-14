import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { GlassMockCard } from '../../../components/motion/GlassMockCard';
import { AmbientGlow } from '../../../components/motion/AmbientGlow';
import { Shimmer } from '../../../components/motion/Shimmer';
import { StaggerIn } from '../../../components/motion/StaggerIn';
import { CountUpText } from '../../../components/motion/CountUpText';
import { useTheme } from '../../../theme';

const CARD_WIDTH = 252;

const BUSINESS_TYPES = [
  { label: 'General Store', highlight: true },
  { label: 'Pharmacy' },
  { label: 'Hardware' },
  { label: 'Boutique' },
];

// Slide 1 — "any kind of shop, one app": a business-type switcher card so the
// headline claim is shown, not just stated, plus a live sales stat beneath
// it to establish this is a real working app, not a generic illustration.
export function BusinessSwitcherMockup() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      <AmbientGlow color={colors.brand.accent} size={CARD_WIDTH - 20} />
      <GlassMockCard width={CARD_WIDTH} glowColor={colors.brand.accent}>
        <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.sm }]}>
          CHOOSE YOUR BUSINESS
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {BUSINESS_TYPES.map((biz, i) => (
            <StaggerIn key={biz.label} delay={i * 90} style={{ width: '48%' }}>
              <Pill label={biz.label} highlight={biz.highlight} />
            </StaggerIn>
          ))}
        </View>

        <View
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.surface.border,
            borderStyle: 'dashed',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Today's Sales</Text>
            <CountUpText
              toValue={12400}
              prefix="Rs "
              style={[typography.numericLarge, { color: colors.ink.primary }]}
            />
          </View>
          <View
            style={{
              backgroundColor: colors.semantic.successBg,
              borderRadius: radii.pill,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Text style={[typography.label, { color: colors.semantic.success }]}>+12%</Text>
          </View>
        </View>

        <Shimmer parentWidth={CARD_WIDTH} />
      </GlassMockCard>
    </View>
  );
}

function Pill({ label, highlight }) {
  const { colors, radii, typography, spacing } = useTheme();
  const bg = highlight ? colors.brand.accent : colors.brand.primary + '1A';
  const fg = highlight ? colors.ink.primary : colors.ink.secondary;
  const dot = highlight ? colors.brand.primary : colors.brand.primary + '80';

  return (
    <MotiView
      animate={{ scale: highlight ? [1, 1.04, 1] : 1 }}
      transition={{ type: 'timing', duration: 1800, loop: !!highlight }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: bg,
        borderRadius: radii.pill,
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        shadowColor: highlight ? colors.brand.accent : 'transparent',
        shadowOpacity: highlight ? 0.5 : 0,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />
      <Text style={[typography.caption, { color: fg, fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
    </MotiView>
  );
}
