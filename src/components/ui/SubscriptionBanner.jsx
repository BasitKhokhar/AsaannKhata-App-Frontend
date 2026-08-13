import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useEntitlement } from '../../hooks/useEntitlement';

// Soft paywall — shown on screens with create actions when the cached
// entitlement says canWrite is false (expired trial/lapsed plan). Never
// blocks the local write itself; the only real consequence is that new
// rows pile up as `pending` until the plan is renewed (see Sync Status).
export function SubscriptionBanner() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: entitlement } = useEntitlement();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !entitlement || entitlement.canWrite) return null;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderRadius: radii.md,
        padding: spacing.sm,
        backgroundColor: colors.semantic.warningBg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Text style={[typography.caption, { color: colors.semantic.warning, flex: 1 }]}>
        Your plan has expired. New items are saved on this device — subscribe to keep syncing.
      </Text>
      <Pressable onPress={() => navigation.navigate('SubscriptionPlans')}>
        <Text style={[typography.label, { color: colors.semantic.warning }]}>Renew</Text>
      </Pressable>
      <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
        <Text style={[typography.label, { color: colors.semantic.warning }]}>✕</Text>
      </Pressable>
    </View>
  );
}
