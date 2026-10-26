import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { authApi } from '../../services/authApi';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { Header } from '../../components/ui/Header';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function ForgotPassword() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';

  async function sendCode() {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError(t('auth.forgotPassword.invalidEmail'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.requestPasswordReset(normalized);
      navigation.navigate('OtpVerification', { email: normalized });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.forgotPassword.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

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

            {error ? <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.sm, textAlign }]}>{error}</Text> : null}
            <Button title={t('auth.forgotPassword.sendResetCode')} onPress={sendCode} loading={loading} disabled={!email.trim()} style={{ marginTop: spacing.xl }} />

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
