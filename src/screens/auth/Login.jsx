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

export default function Login() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLoginMutation();

  const error = loginMutation.isError
    ? loginMutation.error?.response?.data?.message || 'Could not log in. Check your details and try again.'
    : null;

  function handleSubmit() {
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl }} keyboardShouldPersistTaps="handled">
            <Logo size={40} color={colors.brand.primary} accentColor={colors.brand.accentLight} />
            <Text style={[typography.h1, { color: colors.ink.primary, marginTop: spacing.lg }]}>Welcome back</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs }]}>
              Log in to manage your shops.
            </Text>

            <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
              <TextField
                label="Email or phone"
                value={email}
                onChangeText={setEmail}
                placeholder="owner@shop.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {error ? (
              <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.md }]}>{error}</Text>
            ) : null}

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginTop: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.brand.accentDark }]}>Forgot password?</Text>
            </Pressable>

            <Button
              title="Log In"
              onPress={handleSubmit}
              loading={loginMutation.isPending}
              disabled={!email || !password}
              style={{ marginTop: spacing.xl }}
            />

            <View style={{ flex: 1, minHeight: spacing.xxl }} />

            <Pressable onPress={() => navigation.navigate('RegisterStep1')} style={{ alignSelf: 'center' }}>
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                New to AsaanKhata? <Text style={{ color: colors.brand.accentDark, fontFamily: typography.bodyMedium.fontFamily }}>Register</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
