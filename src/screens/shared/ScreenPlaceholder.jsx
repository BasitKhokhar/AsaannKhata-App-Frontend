import React from 'react';
import { Text } from 'react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { useTheme } from '../../theme';

// Temporary stand-in used while a screen hasn't been built out yet — every
// screen referenced by the navigators must exist as a real file so the app
// compiles and is navigable end-to-end before each phase fleshes it out.
export function ScreenPlaceholder({ name }) {
  const { colors, typography } = useTheme();
  return (
    <AnimatedScreen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[typography.h2, { color: colors.ink.primary }]}>{name}</Text>
      <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 8 }]}>Coming soon</Text>
    </AnimatedScreen>
  );
}
