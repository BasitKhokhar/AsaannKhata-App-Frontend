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

export default function RegisterStep1() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const store = useRegisterStore();
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
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (local.password !== local.confirmPassword) {
      setError('Passwords do not match.');
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
            <TextField label="Full name" value={local.name} onChangeText={(v) => update('name', v)} placeholder="Fatima Noor" />
            <TextField
              label="Email"
              value={local.email}
              onChangeText={(v) => update('email', v)}
              placeholder="fatima@shop.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label="Phone"
              value={local.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="+92 300 1234567"
              keyboardType="phone-pad"
            />
            <TextField label="Password" value={local.password} onChangeText={(v) => update('password', v)} placeholder="••••••••" secureTextEntry />
            <TextField
              label="Confirm password"
              value={local.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              placeholder="••••••••"
              secureTextEntry
            />
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={{ padding: spacing.lg }}>
          <Button title="Continue" onPress={handleContinue} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
