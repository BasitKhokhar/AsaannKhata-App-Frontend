import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// Onboarding / registration-wizard step indicator — active dot grows into a
// pill with the brand gradient, inactive dots stay small neutral circles.
export function ProgressDots({ count, activeIndex }) {
  const { colors, radii, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <MotiView
            key={i}
            animate={{ width: active ? 20 : 6 }}
            transition={{ type: 'spring', damping: 16, stiffness: 180 }}
            style={{
              height: 6,
              borderRadius: radii.sm / 2,
              backgroundColor: active ? colors.brand.primary : colors.surface.border,
              overflow: 'hidden',
            }}
          />
        );
      })}
    </View>
  );
}
