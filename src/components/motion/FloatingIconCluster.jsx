import React from 'react';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

// Infinite gentle bob — used for onboarding illustrations, the splash logo,
// and empty-state icons. `delay` staggers multiple instances on one screen.
export function FloatingIconCluster({ children, delay = 0, distance = 10, style }) {
  const { motion } = useTheme();
  return (
    <MotiView
      style={style}
      animate={{ translateY: [0, -distance, 0] }}
      transition={{
        type: 'timing',
        duration: motion.duration.float,
        loop: true,
        delay,
      }}
    >
      {children}
    </MotiView>
  );
}
