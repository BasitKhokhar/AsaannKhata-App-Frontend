import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../../theme';

// Selectable filter pill — generalizes the filter-pill pattern that used to
// be hand-rolled (and inconsistently themed, see ink.onBrand in colors.js)
// on Products, Sales Report, Stock adjust direction, and Add Product's
// stock-mode picker.
export function Chip({ label, selected, onPress, style }) {
  const { colors, radii, typography, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: selected ? colors.brand.primary : 'transparent',
          borderWidth: selected ? 0 : 1,
          borderColor: colors.surface.border,
        },
        style,
      ]}
    >
      <Text style={[typography.label, { color: selected ? colors.ink.onBrand : colors.ink.secondary }]}>{label}</Text>
    </Pressable>
  );
}
