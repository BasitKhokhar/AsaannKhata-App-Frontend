import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';

const STEP_LABELS = ['YOUR ACCOUNT', 'FIRST SHOP', 'CHOOSE A PLAN'];

export function RegisterWizardHeader({ step }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text style={[typography.h3, { color: colors.ink.primary }]}>Create Account</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= step ? colors.brand.primary : colors.surface.border,
            }}
          />
        ))}
      </View>
      <Text style={[typography.label, { color: colors.ink.secondary, marginTop: spacing.sm }]}>
        STEP {step + 1} OF 3 · {STEP_LABELS[step]}
      </Text>
    </View>
  );
}
