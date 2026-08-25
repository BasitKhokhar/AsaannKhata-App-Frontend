import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme';

// Label + optional right-side action, used above grouped list sections
// (Settings hub groups, Stock ledger sections, Dashboard sections).
export function SectionHeader({ title, actionLabel, onAction, style }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
        style,
      ]}
    >
      <Text style={[typography.h3, { color: colors.ink.primary }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[typography.label, { color: colors.brand.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
