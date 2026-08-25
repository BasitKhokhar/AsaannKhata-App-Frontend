import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { RefreshCw } from 'lucide-react-native';
import { GlassMockCard } from '../../../components/motion/GlassMockCard';
import { AmbientGlow } from '../../../components/motion/AmbientGlow';
import { StaggerIn } from '../../../components/motion/StaggerIn';
import { useTheme } from '../../../theme';

const WRAP_WIDTH = 260;

// Slide 4 — offline/sync: two device previews with a continuously flowing
// connection between them (pulse dots + a spinning sync glyph) instead of a
// single static dashed arrow.
export function SyncDevicesMockup() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View style={{ width: WRAP_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      <AmbientGlow color={colors.brand.primary} size={WRAP_WIDTH - 20} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <Phone delay={0} />

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <FlowDots />
          <SyncGlyph />
        </View>

        <Phone delay={120} />
      </View>

      <StaggerIn
        delay={500}
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.semantic.successBg,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.semantic.success }} />
        <Text style={[typography.label, { color: colors.semantic.success, fontSize: 11 }]}>Synced across devices</Text>
      </StaggerIn>
    </View>
  );
}

function Phone({ delay }) {
  const { colors } = useTheme();
  return (
    <StaggerIn delay={delay}>
      <GlassMockCard width={58} glowColor={colors.brand.primary}>
        <View style={{ gap: 6 }}>
          <View style={{ height: 5, width: '80%', borderRadius: 3, backgroundColor: colors.brand.primary + '40' }} />
          <View style={{ height: 5, width: '55%', borderRadius: 3, backgroundColor: colors.surface.border }} />
          <View style={{ height: 5, width: '65%', borderRadius: 3, backgroundColor: colors.surface.border }} />
          <View
            style={{ height: 20, borderRadius: 6, backgroundColor: colors.brand.accent + '33', marginTop: 4 }}
          />
        </View>
      </GlassMockCard>
    </StaggerIn>
  );
}

function FlowDots() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.brand.accent }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ type: 'timing', duration: 1200, loop: true, delay: i * 200 }}
        />
      ))}
    </View>
  );
}

function SyncGlyph() {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ rotate: '0deg' }}
      animate={{ rotate: '360deg' }}
      transition={{ type: 'timing', duration: 2600, loop: true, easing: Easing.linear }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.brand.primary + '1A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RefreshCw size={16} color={colors.brand.primary} strokeWidth={2} />
    </MotiView>
  );
}
