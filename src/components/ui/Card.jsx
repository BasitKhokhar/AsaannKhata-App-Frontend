import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';

export function Card({ children, style, bordered = true }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.surface.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
