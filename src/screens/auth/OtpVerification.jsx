import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';
import { authApi } from '../../services/authApi';

export default function OtpVerification() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!secondsLeft) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resetPassword() {
    if (!/^\d{6}$/.test(code)) return setError(t('auth.otp.invalidCode'));
    if (newPassword.length < 12 || newPassword.length > 128) return setError(t('auth.otp.invalidPassword'));
    if (newPassword !== confirmPassword) return setError(t('auth.otp.passwordMismatch'));
    setError('');
    setLoading(true);
    try {
      await authApi.confirmPasswordReset({ email, code, newPassword });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.otp.resetFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (secondsLeft || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.requestPasswordReset(email);
      setSecondsLeft(60);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.forgotPassword.requestFailed'));
    } finally {
      setResending(false);
    }
  }

  return (
    <GradientShiftBackground colors={[colors.surface.bg, colors.brand.accentLight + '33']}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header showBack transparent title="" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: spacing.md }} keyboardShouldPersistTaps="handled">
            <Text style={[typography.h1, { color: colors.ink.primary, textAlign }]}>{t('auth.otp.title')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>{t('auth.otp.subtitle')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>{email}</Text>
            <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
              <TextField label={t('auth.otp.code')} value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
              <TextField label={t('auth.otp.newPassword')} value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
              <TextField label={t('auth.otp.confirmPassword')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
            </View>
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.md, textAlign }]}>{error}</Text> : null}
            <Pressable onPress={resendCode} disabled={secondsLeft > 0 || resending} style={{ alignSelf: isUrdu ? 'flex-end' : 'flex-start', marginTop: spacing.lg }}>
              <Text style={[typography.caption, { color: secondsLeft ? colors.ink.secondary : colors.brand.accentDark }]}>{t('auth.otp.resendIn')}{secondsLeft ? ` ${secondsLeft}s` : ''}</Text>
            </Pressable>
            <View style={{ flex: 1, minHeight: spacing.xl }} />
            <Button title={t('auth.otp.verify')} onPress={resetPassword} loading={loading} disabled={!email || code.length !== 6 || !newPassword || !confirmPassword} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientShiftBackground>
  );
}
