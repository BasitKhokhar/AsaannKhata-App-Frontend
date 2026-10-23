import React from 'react';
import { View, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

const STEP_LABEL_KEYS = ['auth.register.stepBusinessType', 'auth.register.stepFirstShop', 'auth.register.stepYourAccount'];

export function RegisterWizardHeader({ step }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.xs }}>
        <IconButton icon={ArrowLeft} onPress={() => navigation.goBack()} style={{ marginLeft: -spacing.sm }} />
        <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('auth.register.createAccount')}</Text>
      </View>

      <View style={{ flexDirection: rowDirection, gap: spacing.xs, marginTop: spacing.lg }}>
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
      <Text style={[typography.label, { color: colors.ink.secondary, marginTop: spacing.sm, textAlign: isUrdu ? 'right' : 'left' }]}>
        {t('auth.register.stepOf').replace('{step}', step + 1)} · {t(STEP_LABEL_KEYS[step])}
      </Text>
    </View>
  );
}
