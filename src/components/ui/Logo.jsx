import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// The AsaanKhata mark — a ledger tab folded into a monogram (open khata book
// with an amber bookmark tab), per the branding doc. `color` is the main
// ink/glyph fill, `accentColor` is the small bookmark tab.
export function Logo({ size = 40, color = '#2E4270', accentColor = '#C6982F' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 12 L22 86 L34 86 L50 42 Z" fill={color} />
      <Path d="M50 12 L78 86 L66 86 L50 42 Z" fill={color} />
      <Rect x="31" y="58" width="38" height="9" rx="3" fill={color} />
      <Path d="M43 40 H57 V60 L50 54 L43 60 Z" fill={accentColor} />
    </Svg>
  );
}
