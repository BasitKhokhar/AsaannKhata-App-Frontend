import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

// A translucent diagonal band that continuously sweeps across its parent —
// the "live data" polish trick used on premium onboarding cards. Parent must
// be positioned (relative) with overflow hidden content it wants swept.
export function Shimmer({ width = 90, parentWidth = 240, style }) {
  const { motion } = useTheme();

  return (
    <MotiView pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}>
      <MotiView
        style={{ width, height: '160%', position: 'absolute', top: '-30%' }}
        from={{ translateX: -width }}
        animate={{ translateX: parentWidth + width }}
        transition={{ type: 'timing', duration: motion.duration.shimmer, loop: true }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, transform: [{ rotate: '18deg' }] }}
        />
      </MotiView>
    </MotiView>
  );
}
