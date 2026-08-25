import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { IconButton } from './IconButton';

// Shared back/title/right-action header — replaces the back-chevron-plus-
// title row that used to be hand-rolled per screen. Every stack in the app
// runs with headerShown:false, so this component *is* the header.
export function Header({ title, subtitle, onBack, showBack = true, right, transparent = false, style }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[{ backgroundColor: transparent ? 'transparent' : colors.surface.bg }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        {showBack ? (
          <IconButton icon={ArrowLeft} onPress={onBack || (() => navigation.goBack())} style={{ marginLeft: -spacing.sm }} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: colors.ink.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.caption, { color: colors.ink.secondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </SafeAreaView>
  );
}
