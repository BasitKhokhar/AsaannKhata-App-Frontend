import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { useRegisterMutation } from '../../hooks/useAuth';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RegisterStep3() {
  const { colors, radii, typography, spacing } = useTheme();
  const store = useRegisterStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const [name, setName] = useState(store.name);
  const [email, setEmail] = useState(store.email);
  const [phone, setPhone] = useState(store.phone);
  const [password, setPassword] = useState(store.password);
  const [confirmPassword, setConfirmPassword] = useState(store.confirmPassword);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const register = useRegisterMutation();

  async function submit() {
    if (!name.trim() || !email.trim() || !password) {
      setError(t('auth.register1.errorRequired'));
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError(t('auth.register1.errorPasswordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.register1.errorPasswordMismatch'));
      return;
    }
    if (!agreed) {
      setError(t('auth.register3.errorAgree'));
      return;
    }
    setError(null);
    try {
      await register.mutateAsync({
        name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined,
        password, shopTypeCode: store.shopTypeCode, shopName: store.shopName,
        shopAddress: store.shopAddress || undefined, shopPhone: store.shopPhone || undefined,
      });
      store.reset();
    } catch (submitError) {
      setError(submitError?.response?.data?.message || t('auth.register3.genericError'));
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={2} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
            <TextField label={t('auth.register1.fullName')} value={name} onChangeText={setName} placeholder={t('auth.account.namePlaceholder')} />
            <TextField label={t('auth.register1.email')} value={email} onChangeText={setEmail} placeholder={t('auth.account.emailPlaceholder')} autoCapitalize="none" keyboardType="email-address" />
            <TextField label={t('auth.register1.phone')} value={phone} onChangeText={setPhone} placeholder={t('auth.shopDetails.phonePlaceholder')} keyboardType="phone-pad" />
            <TextField label={t('auth.register1.password')} value={password} onChangeText={setPassword} placeholder={t('auth.account.passwordPlaceholder')} secureTextEntry />
            <TextField label={t('auth.register1.confirmPassword')} value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t('auth.account.confirmPlaceholder')} secureTextEntry />
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((value) => !value)} style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
              <View style={{ width: 19, height: 19, borderRadius: radii.sm / 2, borderWidth: 1.5, borderColor: agreed ? colors.brand.primary : colors.surface.border, backgroundColor: agreed ? colors.brand.primary : colors.surface.raised, alignItems: 'center', justifyContent: 'center' }}>
                {agreed ? <Check size={13} color={colors.ink.onBrand} strokeWidth={2.4} /> : null}
              </View>
              <Text style={[typography.caption, { color: colors.ink.secondary, flex: 1, textAlign: isUrdu ? 'right' : 'left' }]}>
                {t('auth.register3.agreePrefix')} {t('auth.register3.termsOfService')} {t('auth.register3.and')} {t('auth.register3.privacyPolicy')}
              </Text>
            </Pressable>
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
          </ScrollView>
          <View style={{ padding: spacing.lg }}><Button title={t('auth.register3.createAccount')} onPress={submit} loading={register.isPending} /></View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
