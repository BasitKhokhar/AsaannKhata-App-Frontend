import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';

// Rounded, tinted icon container used across onboarding illustrations and
// stock-mode badges — tone alternates navy/gold per the design's grids.
export function IconTile({ children, tone = 'navy', size = 64 }) {
  const { colors, radii } = useTheme();
  const bg = tone === 'gold' ? colors.brand.accentLight + '59' : colors.brand.primary + '26';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
