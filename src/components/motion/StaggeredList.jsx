import React from 'react';
import { MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../theme';

// Wraps FlashList's renderItem so each row entrance is staggered by index —
// used for product rows, invoice rows, customer rows, everywhere a list
// of cards should feel like it's "arriving" rather than just appearing.
export function StaggeredList({ data, renderItem, estimatedItemSize = 72, ...flashListProps }) {
  const { motion } = useTheme();

  return (
    <FlashList
      data={data}
      estimatedItemSize={estimatedItemSize}
      renderItem={(info) => (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 280, delay: Math.min(info.index, 12) * motion.stagger }}
        >
          {renderItem(info)}
        </MotiView>
      )}
      {...flashListProps}
    />
  );
}
