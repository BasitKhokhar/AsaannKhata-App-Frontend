import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';

// Generic row primitive: leading icon/avatar, title/subtitle, trailing
// content or a chevron. Replaces the Settings hub's hand-rolled rows and is
// the base row shape for the Stock ledger, SyncStatus per-shop rows, and
// the new Linked Devices section.
export function ListRow({ leading, title, subtitle, trailing, onPress, showChevron, style, titleStyle, subtitleStyle }) {
  const { colors, radii, typography, spacing } = useTheme();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
        },
        style,
      ]}
    >
      {leading}
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { color: colors.ink.primary }, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.ink.secondary }, subtitleStyle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <ChevronRight size={18} color={colors.ink.secondary} /> : null}
    </Wrapper>
  );
}
