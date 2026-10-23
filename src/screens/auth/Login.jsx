import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Logo } from '../../components/ui/Logo';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useLoginMutation } from '../../hooks/useAuth';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function Login() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLoginMutation();
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';

  const error = loginMutation.isError ? loginMutation.error?.response?.data?.message || t('auth.login.genericError') : null;

  function handleSubmit() {
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
              <Logo size={68} color={colors.brand.primary} accentColor={colors.brand.accentLight} />
              <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.sm }]}>AsaanKhata</Text>
              <Text style={[typography.h1, { color: colors.ink.primary, marginTop: spacing.xl, textAlign: 'center' }]}>{t('auth.login.welcomeBack')}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign: 'center' }]}>
                {t('auth.login.subtitle')}
              </Text>
            </View>

            <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
              <TextField
                label={t('auth.login.emailOrPhone')}
                value={email}
                onChangeText={setEmail}
                placeholder="owner@shop.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextField
                label={t('auth.login.password')}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {error ? (
              <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.md, textAlign }]}>{error}</Text>
            ) : null}

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: isUrdu ? 'flex-start' : 'flex-end', marginTop: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.brand.accentDark }]}>{t('auth.login.forgotPassword')}</Text>
            </Pressable>

            <Button
              title={t('auth.login.logIn')}
              onPress={handleSubmit}
              loading={loginMutation.isPending}
              disabled={!email || !password}
              style={{ marginTop: spacing.xl }}
            />

            <View style={{ flex: 1, minHeight: spacing.xxl }} />

            <Pressable onPress={() => navigation.navigate('RegisterStep1')} style={{ alignSelf: 'center' }}>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {t('auth.login.newToApp')}{' '}
                <Text style={{ color: colors.brand.accentDark, fontFamily: typography.bodyMedium.fontFamily }}>{t('auth.login.register')}</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
