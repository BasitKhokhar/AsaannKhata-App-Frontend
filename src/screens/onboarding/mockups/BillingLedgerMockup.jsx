import React from 'react';
import { View, Text } from 'react-native';
import { GlassMockCard } from '../../../components/motion/GlassMockCard';
import { AmbientGlow } from '../../../components/motion/AmbientGlow';
import { Shimmer } from '../../../components/motion/Shimmer';
import { StaggerIn } from '../../../components/motion/StaggerIn';
import { CountUpText } from '../../../components/motion/CountUpText';
import { useTheme } from '../../../theme';

const CARD_WIDTH = 250;

const ITEMS = [
  { name: 'Rice 5kg', qty: 'x2', amount: 900 },
  { name: 'Sugar 1kg', qty: 'x3', amount: 450 },
  { name: 'Tea Pack', qty: 'x1', amount: 1050 },
];

// Slide 3 — billing/khata: a real invoice card with itemized rows, a
// count-up total, and a "khata" due badge instead of gray skeleton bars.
export function BillingLedgerMockup() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      <AmbientGlow color={colors.brand.accent} size={CARD_WIDTH - 10} />
      <GlassMockCard width={CARD_WIDTH} glowColor={colors.brand.accent}>
        <StaggerIn delay={0} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[typography.label, { color: colors.ink.inverse }]}>A</Text>
          </View>
          <View>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary, fontSize: 13 }]}>Ali Traders</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, fontSize: 10 }]}>Customer</Text>
          </View>
        </StaggerIn>

        <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
          {ITEMS.map((item, i) => (
            <StaggerIn
              key={item.name}
              delay={120 + i * 90}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {item.name} <Text style={{ color: colors.ink.secondary }}>{item.qty}</Text>
              </Text>
              <Text style={[typography.numeric, { color: colors.ink.primary, fontSize: 12 }]}>Rs {item.amount}</Text>
            </StaggerIn>
          ))}
        </View>

        <StaggerIn
          delay={420}
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.surface.border,
            borderStyle: 'dashed',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={[typography.label, { color: colors.ink.primary }]}>Total</Text>
          <CountUpText
            toValue={2400}
            prefix="Rs "
            style={[typography.numericLarge, { color: colors.brand.accentDark, fontSize: 18 }]}
          />
        </StaggerIn>

        <StaggerIn
          delay={520}
          style={{ marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={[typography.caption, { color: colors.semantic.success }]}>Paid Rs 1,000</Text>
          <View
            style={{
              backgroundColor: colors.brand.accent + '26',
              borderRadius: radii.pill,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Text style={[typography.label, { color: colors.brand.accentDark, fontSize: 10 }]}>KHATA · Rs 1,400 due</Text>
          </View>
        </StaggerIn>

        <Shimmer parentWidth={CARD_WIDTH} />
      </GlassMockCard>
    </View>
  );
}
