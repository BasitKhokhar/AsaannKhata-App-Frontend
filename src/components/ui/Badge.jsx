import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';

// tone: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
export function Badge({ label, tone = 'neutral' }) {
  const { colors, radii, typography, spacing } = useTheme();

  const { bg, fg } =
    tone === 'success'
      ? { bg: colors.semantic.successBg, fg: colors.semantic.success }
      : tone === 'warning'
      ? { bg: colors.semantic.warningBg, fg: colors.semantic.warning }
      : tone === 'danger'
      ? { bg: colors.semantic.dangerBg, fg: colors.semantic.danger }
      : tone === 'brand'
      ? { bg: colors.surface.card, fg: colors.brand.primary }
      : { bg: colors.surface.card, fg: colors.ink.secondary };

  return (
    <View style={{ backgroundColor: bg, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={[typography.label, { color: fg }]}>{label}</Text>
    </View>
  );
}
