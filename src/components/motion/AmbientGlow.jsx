import React from 'react';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// Soft breathing color blob placed behind onboarding mockup cards for a
// sense of depth/light — a translucent circle is enough of a "glow" without
// needing blur (Android doesn't blur shadows), so it stays cheap everywhere.
export function AmbientGlow({ color, size = 220, style }) {
  const { colors, motion } = useTheme();
  const glow = color || colors.brand.accent;

  return (
    <MotiView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -size / 2,
          marginLeft: -size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: glow,
        },
        style,
      ]}
      animate={{ opacity: [0.18, 0.4, 0.18], scale: [0.94, 1.05, 0.94] }}
      transition={{ type: 'timing', duration: motion.duration.breathe, loop: true }}
    />
  );
}
