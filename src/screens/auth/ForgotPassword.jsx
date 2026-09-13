import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { Header } from '../../components/ui/Header';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

// The backend has no password-reset/OTP endpoints yet — this is built as
// complete, on-brand UI with submission disabled, per the plan's decision
// to flag this as a separate follow-up rather than fake the behavior.
export default function ForgotPassword() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const [email, setEmail] = useState('');
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';

  return (
    <GradientShiftBackground colors={[colors.surface.bg, colors.brand.accentLight + '33']}>
      {/* Header owns the top safe-area inset itself, so this SafeAreaView
          only needs to cover the remaining edges. */}
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header showBack transparent title="" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, padding: spacing.xl, paddingTop: spacing.md }}>
            <View
              style={[
                {
                  width: 64,
                  height: 64,
                  borderRadius: radii.xl,
                  backgroundColor: colors.brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                elevation.sm,
              ]}
            >
              <Lock size={26} color={colors.ink.onBrand} strokeWidth={1.8} />
            </View>

            <Text style={[typography.h1, { color: colors.ink.primary, marginTop: spacing.lg, textAlign }]}>{t('auth.forgotPassword.title')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>
              {t('auth.forgotPassword.subtitle')}
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <TextField
                label={t('auth.forgotPassword.email')}
                value={email}
                onChangeText={setEmail}
                placeholder="owner@shop.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Button title={t('auth.forgotPassword.sendResetCode')} onPress={() => {}} disabled style={{ marginTop: spacing.xl }} />
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.sm }]}>
              {t('auth.forgotPassword.comingSoon')}
            </Text>

            <View style={{ flex: 1 }} />

            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>
              {t('auth.forgotPassword.rememberedIt')}{' '}
              <Text style={{ color: colors.brand.accentDark, fontWeight: '600' }} onPress={() => navigation.goBack()}>
                {t('auth.forgotPassword.logIn')}
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientShiftBackground>
  );
}
