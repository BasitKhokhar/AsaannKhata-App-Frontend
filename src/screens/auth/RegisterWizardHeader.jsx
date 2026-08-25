import React from 'react';
import { View, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme';

const STEP_LABELS = ['YOUR ACCOUNT', 'FIRST SHOP', 'CHOOSE A PLAN'];

export function RegisterWizardHeader({ step }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton icon={ArrowLeft} onPress={() => navigation.goBack()} style={{ marginLeft: -spacing.sm }} />
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
