import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { FloatingIconCluster } from '../motion/FloatingIconCluster';
import { Button } from './Button';

// Reused across every empty list state in the app (products, bills,
// customers, ...) — built once here rather than per-screen.
export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.lg }}>
      <FloatingIconCluster>
        <LinearGradient
          colors={[colors.brand.primary + '22', colors.brand.accent + '33']}
          style={{ width: 96, height: 96, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </LinearGradient>
      </FloatingIconCluster>
      <Text style={[typography.h3, { color: colors.ink.primary, textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{description}</Text>
      ) : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} style={{ paddingHorizontal: spacing.xl }} /> : null}
    </View>
  );
}
