import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Shimmer } from '../motion/Shimmer';

// Content-shaped loading placeholder — a tinted block with a Shimmer sweep,
// used instead of a bare spinner so a loading list/card keeps its layout
// (Dashboard, ProductsList, Stock, Reports) rather than jumping when data
// arrives.
export function Skeleton({ width = '100%', height = 16, radius, style }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? radii.sm,
          backgroundColor: colors.surface.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Shimmer parentWidth={typeof width === 'number' ? width : 240} />
    </View>
  );
}

// A single row shaped like ListRow — the common loading case (product list,
// stock ledger, bill list) while data loads.
export function SkeletonListRow({ style }) {
  const { spacing, radii } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }, style]}>
      <Skeleton width={40} height={40} radius={radii.md} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={11} />
      </View>
    </View>
  );
}
