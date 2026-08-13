import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// Every screen body is wrapped in this so the whole app gets a consistent
// "premium" fade + rise entrance on mount/focus without per-screen code.
export function AnimatedScreen({ children, style, delay = 0 }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface.bg }, style]}>
      <MotiView
        style={{ flex: 1 }}
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380, delay }}
      >
        {children}
      </MotiView>
    </View>
  );
}
