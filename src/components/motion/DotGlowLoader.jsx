import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// Staggered pulsing dots — splash loader, OTP resend indicator.
export function DotGlowLoader({ count = 3, color, size = 6 }) {
  const { colors, motion, spacing } = useTheme();
  const dotColor = color || colors.brand.accent;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {Array.from({ length: count }).map((_, i) => (
        <MotiView
          key={i}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            type: 'timing',
            duration: motion.duration.dotGlow,
            loop: true,
            delay: i * (motion.duration.dotGlow / count),
          }}
        />
      ))}
    </View>
  );
}
