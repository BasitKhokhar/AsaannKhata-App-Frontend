import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../theme';

function formatNumber(n) {
  return Math.round(n).toLocaleString('en-IN');
}

// Numeric "premium data reveal" — counts up from 0 to `toValue` with an
// ease-out curve instead of appearing instantly, e.g. Rs 0 -> Rs 2,400.
export function CountUpText({ toValue, prefix = '', duration, style }) {
  const { motion } = useTheme();
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    const dur = duration ?? motion.duration.countUp;
    startRef.current = null;
    let raf;
    function tick(now) {
      if (startRef.current == null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(toValue * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [toValue, duration, motion.duration.countUp]);

  return (
    <Text style={style}>
      {prefix}
      {formatNumber(display)}
    </Text>
  );
}
