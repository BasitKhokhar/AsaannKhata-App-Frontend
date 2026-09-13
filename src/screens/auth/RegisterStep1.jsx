import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RegisterStep1() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const store = useRegisterStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';
  const [local, setLocal] = useState({
    name: store.name,
    email: store.email,
    phone: store.phone,
    password: store.password,
    confirmPassword: store.confirmPassword,
  });
  const [error, setError] = useState(null);

  function update(field, value) {
    setLocal((l) => ({ ...l, [field]: value }));
  }

  function handleContinue() {
    if (!local.name || !local.email || !local.password) {
      setError(t('auth.register1.errorRequired'));
      return;
    }
    if (local.password !== local.confirmPassword) {
      setError(t('auth.register1.errorPasswordMismatch'));
      return;
    }
    setError(null);
    store.setFields(local);
    navigation.navigate('RegisterStep2');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={0} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
            <TextField label={t('auth.register1.fullName')} value={local.name} onChangeText={(v) => update('name', v)} placeholder="Fatima Noor" />
            <TextField
              label={t('auth.register1.email')}
              value={local.email}
              onChangeText={(v) => update('email', v)}
              placeholder="fatima@shop.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label={t('auth.register1.phone')}
              value={local.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="+92 300 1234567"
              keyboardType="phone-pad"
            />
            <TextField
              label={t('auth.register1.password')}
              value={local.password}
              onChangeText={(v) => update('password', v)}
              placeholder="••••••••"
              secureTextEntry
            />
            <TextField
              label={t('auth.register1.confirmPassword')}
              value={local.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              placeholder="••••••••"
              secureTextEntry
            />
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{error}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={{ padding: spacing.lg }}>
          <Button title={t('auth.register1.continue')} onPress={handleContinue} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
