import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from './Card';

// Dashboard-style metric tile: icon chip + big value + label, optionally a
// trend delta. Extracted from Dashboard's inline 2-up stat cards so Stock
// overview and Reports can share the same shape instead of reimplementing
// it per screen.
export function StatCard({ icon, label, value, tone = 'primary', trend, style }) {
  const { colors, radii, typography, spacing } = useTheme();
  const tint =
    tone === 'accent'
      ? colors.brand.accent
      : tone === 'danger'
      ? colors.semantic.danger
      : tone === 'success'
      ? colors.semantic.success
      : colors.brand.primary;

  return (
    <Card style={[{ flex: 1, gap: spacing.sm }, style]}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.md,
            backgroundColor: tint + '1F',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text style={[typography.numericLarge, { color: colors.ink.primary }]} numberOfLines={1}>
        {value}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[typography.caption, { color: colors.ink.secondary }]}>{label}</Text>
        {trend ? (
          <Text
            style={[
              typography.caption,
              { color: trend.direction === 'down' ? colors.semantic.danger : colors.semantic.success },
            ]}
          >
            {trend.direction === 'down' ? '↓' : '↑'} {trend.value}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
