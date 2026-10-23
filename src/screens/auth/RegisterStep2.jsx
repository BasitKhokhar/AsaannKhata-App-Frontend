import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RegisterStep2() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const store = useRegisterStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const [shopName, setShopName] = useState(store.shopName);
  const [shopAddress, setShopAddress] = useState(store.shopAddress);
  const [shopPhone, setShopPhone] = useState(store.shopPhone);
  const [error, setError] = useState(null);

  function next() {
    if (!shopName.trim()) {
      setError(t('auth.shopDetails.nameRequired'));
      return;
    }
    store.setFields({ shopName: shopName.trim(), shopAddress: shopAddress.trim(), shopPhone: shopPhone.trim() });
    navigation.navigate('RegisterStep3');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={1} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
            <TextField label={t('auth.register2.shopName')} value={shopName} onChangeText={setShopName} placeholder={t('auth.shopDetails.namePlaceholder')} />
            <TextField label={t('auth.shopDetails.address')} value={shopAddress} onChangeText={setShopAddress} placeholder={t('auth.shopDetails.addressPlaceholder')} multiline style={{ minHeight: 64 }} />
            <TextField label={t('auth.shopDetails.phone')} value={shopPhone} onChangeText={setShopPhone} keyboardType="phone-pad" placeholder={t('auth.shopDetails.phonePlaceholder')} />
            <TextField label={t('auth.shopDetails.country')} value={t('auth.shopDetails.pakistan')} editable={false} />
            <TextField label={t('auth.shopDetails.currency')} value={t('auth.shopDetails.pkr')} editable={false} />
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }]}>{t('auth.shopDetails.currencyNote')}</Text>
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
          </ScrollView>
          <View style={{ padding: spacing.lg }}><Button title={t('common.next')} onPress={next} /></View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
