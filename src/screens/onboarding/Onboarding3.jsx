import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingSlide } from './OnboardingSlide';
import { FloatingIconCluster } from '../../components/motion/FloatingIconCluster';
import { useTheme } from '../../theme';

export default function Onboarding3() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <OnboardingSlide
      index={2}
      nextRoute="Onboarding4"
      title={'Bill customers, track khata,\nget paid'}
      description="Take partial payments and keep a running credit ledger for every customer."
      illustration={
        <FloatingIconCluster delay={250}>
          <View
            style={{
              width: 150,
              backgroundColor: colors.surface.card,
              borderWidth: 1,
              borderColor: colors.surface.border,
              borderRadius: radii.lg,
              padding: spacing.md,
              shadowColor: colors.ink.primary,
              shadowOpacity: 0.14,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            <View style={{ height: 6, width: '70%', backgroundColor: colors.surface.border, borderRadius: 3 }} />
            <View style={{ height: 6, width: '50%', backgroundColor: colors.surface.border, borderRadius: 3, marginTop: 8 }} />
            <View style={{ height: 6, width: '60%', backgroundColor: colors.surface.border, borderRadius: 3, marginTop: 8 }} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 14,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.surface.border,
                borderStyle: 'dashed',
              }}
            >
              <Text style={[typography.label, { color: colors.ink.primary }]}>Total</Text>
              <Text style={[typography.label, { color: colors.brand.accentDark }]}>Rs 2,400</Text>
            </View>
          </View>
        </FloatingIconCluster>
      }
    />
  );
}
