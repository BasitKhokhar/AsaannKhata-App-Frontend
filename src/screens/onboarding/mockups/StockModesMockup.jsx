import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { GlassMockCard } from '../../../components/motion/GlassMockCard';
import { AmbientGlow } from '../../../components/motion/AmbientGlow';
import { Shimmer } from '../../../components/motion/Shimmer';
import { StaggerIn } from '../../../components/motion/StaggerIn';
import { useTheme } from '../../../theme';

const CARD_WIDTH = 260;

const CYCLE_MODES = [
  { unit: '24 pcs', tag: 'qty' },
  { unit: '18 sq.ft', tag: 'area' },
  { unit: '12.5 m', tag: 'length' },
  { unit: '6 packs', tag: 'pack' },
];

const FIXED_ROWS = [
  { name: 'Ceramic Tile', unit: '42 sq.ft', tone: 'navy' },
  { name: 'PVC Pipe', unit: '6 m', tone: 'gold' },
  { name: 'Detergent', unit: '3 packs', tone: 'navy' },
];

// Slide 2 — qty/area/length/pack: one product's badge cycles through every
// stock mode while the rows beneath show other products already using
// different modes side by side, in a real-looking inventory list.
export function StockModesMockup() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      <AmbientGlow color={colors.brand.primary} size={CARD_WIDTH - 10} />
      <GlassMockCard width={CARD_WIDTH} glowColor={colors.brand.primary}>
        <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.sm }]}>INVENTORY</Text>

        <StaggerIn delay={0}>
          <Row name="Basmati Rice" tone="gold" featured />
        </StaggerIn>

        {FIXED_ROWS.map((row, i) => (
          <StaggerIn key={row.name} delay={(i + 1) * 90} style={{ marginTop: spacing.sm }}>
            <Row name={row.name} unit={row.unit} tone={row.tone} />
          </StaggerIn>
        ))}

        <Shimmer parentWidth={CARD_WIDTH} />
      </GlassMockCard>
    </View>
  );
}

function Row({ name, unit, tone, featured }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: tone === 'gold' ? colors.brand.accent : colors.brand.primary,
          }}
        />
        <Text style={[typography.bodyMedium, { color: colors.ink.primary, fontSize: 13 }]}>{name}</Text>
      </View>
      {featured ? <CyclingUnitBadge /> : <StaticBadge unit={unit} tone={tone} />}
    </View>
  );
}

function StaticBadge({ unit, tone }) {
  const { colors, radii, typography, spacing } = useTheme();
  const bg = tone === 'gold' ? colors.brand.accent + '26' : colors.brand.primary + '1A';
  const fg = tone === 'gold' ? colors.brand.accentDark : colors.brand.primary;

  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 }}>
      <Text style={[typography.numeric, { color: fg, fontSize: 12 }]}>{unit}</Text>
    </View>
  );
}

function CyclingUnitBadge() {
  const { colors, radii, typography, spacing } = useTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % CYCLE_MODES.length), 1500);
    return () => clearInterval(id);
  }, []);

  const mode = CYCLE_MODES[index];

  return (
    <View
      style={{
        backgroundColor: colors.brand.accent + '26',
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        minWidth: 72,
        alignItems: 'flex-end',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence exitBeforeEnter>
        <MotiView
          key={mode.tag}
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -6 }}
          transition={{ type: 'timing', duration: 260 }}
        >
          <Text style={[typography.numeric, { color: colors.brand.accentDark, fontSize: 12 }]}>{mode.unit}</Text>
        </MotiView>
      </AnimatePresence>
    </View>
  );
}
