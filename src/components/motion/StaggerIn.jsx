import React from 'react';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// One-shot spring entrance (fade + rise) for cascading per-element reveals —
// give each item in a list its own `delay` to build a premium stagger.
export function StaggerIn({ children, delay = 0, distance = 14, style }) {
  const { motion } = useTheme();
  return (
    <MotiView
      style={style}
      from={{ opacity: 0, translateY: distance }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', ...motion.spring.entrance, delay }}
    >
      {children}
    </MotiView>
  );
}
