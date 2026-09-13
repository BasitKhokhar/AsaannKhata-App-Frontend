import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

// UI-complete stub — see ForgotPassword.jsx for why this isn't wired yet.
export default function OtpVerification() {
  const { colors, radii, typography, spacing } = useTheme();
  const digits = ['4', '8', '2', '', '', ''];
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  return (
    <GradientShiftBackground colors={[colors.surface.bg, colors.brand.accentLight + '33']}>
      {/* Header owns the top safe-area inset itself. */}
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header showBack transparent title="" />
        <View style={{ flex: 1, padding: spacing.xl, paddingTop: spacing.md, alignItems: 'center' }}>
          <Text style={[typography.h1, { color: colors.ink.primary, textAlign: 'center' }]}>{t('auth.otp.title')}</Text>
          <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign: 'center' }]}>
            {t('auth.otp.subtitle')}
          </Text>

          <View style={{ flexDirection: rowDirection, gap: spacing.sm, marginTop: spacing.xxl }}>
            {digits.map((d, i) => (
              <View
                key={i}
                style={{
                  width: 38,
                  height: 48,
                  borderRadius: radii.sm,
                  borderWidth: 1.5,
                  borderColor: d ? colors.brand.primary : colors.surface.border,
                  backgroundColor: colors.surface.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[typography.h3, { color: colors.ink.primary }]}>{d}</Text>
              </View>
            ))}
          </View>

          <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.lg }]}>
            {t('auth.otp.resendIn')} <Text style={{ color: colors.brand.accentDark, fontWeight: '700' }}>00:47</Text>
          </Text>

          <View style={{ flex: 1 }} />
          <Button title={t('auth.otp.verify')} onPress={() => {}} disabled style={{ width: '100%' }} />
          <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.sm }]}>{t('auth.otp.comingSoon')}</Text>
        </View>
      </SafeAreaView>
    </GradientShiftBackground>
  );
}
