import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useIsUrdu, useT } from '../../store/languageStore';

export function DateFilterSection({ selectedRange, onPress, style }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('dateFilter.filterPeriod')}: ${selectedRange}`}
      onPress={onPress}
      style={({ pressed }) => [{
        flexDirection: direction,
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 62,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.surface.border,
        backgroundColor: colors.surface.card,
        opacity: pressed ? 0.72 : 1,
      }, style]}
    >
      <CalendarDays size={20} color={colors.brand.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption, { color: colors.ink.secondary, textTransform: 'uppercase', textAlign: align }]}>{t('dateFilter.filterPeriod')}</Text>
        <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{selectedRange}</Text>
      </View>
      <ChevronDown size={20} color={colors.ink.secondary} />
    </Pressable>
  );
}
