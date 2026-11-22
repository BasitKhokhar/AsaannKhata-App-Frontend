import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Header } from '../../components/ui/Header';
import { TextField } from '../../components/ui/TextField';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../store/toastStore';
import { useIsUrdu, useT } from '../../store/languageStore';
import { SUPPORT_EMAIL } from '../../constants/legalPages';

const CATEGORY_KEYS = ['general', 'technical', 'billing', 'privacy', 'deleteAccount'];

export default function ContactSupport() {
  const route = useRoute();
  const t = useT();
  const isUrdu = useIsUrdu();
  const { colors, typography, spacing } = useTheme();
  const accountEmail = useAuthStore((state) => state.email) || '';
  const initialCategory = CATEGORY_KEYS.includes(route.params?.category) ? route.params.category : 'general';
  const [category, setCategory] = useState(initialCategory);
  const [email, setEmail] = useState(accountEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textAlign = isUrdu ? 'right' : 'left';

  async function submit() {
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      showToast(t('settings.helpSupport.form.invalidEmail'), 'danger');
      return;
    }
    if (!subject.trim() || message.trim().length < 10) {
      showToast(t('settings.helpSupport.form.required'), 'danger');
      return;
    }

    const categoryLabel = t(`settings.helpSupport.form.category.${category}`);
    const body = [
      message.trim(),
      '',
      '---',
      `${t('settings.helpSupport.form.categoryLabel')}: ${categoryLabel}`,
      `${t('settings.helpSupport.form.contactEmail')}: ${normalizedEmail}`,
      `Account ID: ${useAuthStore.getState().adminId || 'Unavailable'}`,
      `App version: ${Constants.expoConfig?.version || 'Unknown'}`,
    ].join('\n');
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${categoryLabel}] ${subject.trim()}`)}&body=${encodeURIComponent(body)}`;

    setSending(true);
    try {
      await Linking.openURL(mailto);
      showToast(t('settings.helpSupport.form.emailOpened'), 'success');
    } catch {
      showToast(t('settings.helpSupport.form.emailFailed').replace('{email}', SUPPORT_EMAIL), 'danger');
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('settings.helpSupport.form.title')} subtitle={t('settings.helpSupport.form.subtitle')} />
        <KeyboardAwareView>
          <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
            <Card style={{ gap: spacing.md }}>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{t('settings.helpSupport.form.categoryLabel')}</Text>
              <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {CATEGORY_KEYS.map((key) => (
                  <Chip key={key} label={t(`settings.helpSupport.form.category.${key}`)} selected={category === key} onPress={() => setCategory(key)} />
                ))}
              </View>
              <TextField label={t('settings.helpSupport.form.contactEmail')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextField label={t('settings.helpSupport.form.subject')} value={subject} onChangeText={setSubject} placeholder={t('settings.helpSupport.form.subjectPlaceholder')} maxLength={120} />
              <TextField label={t('settings.helpSupport.form.message')} value={message} onChangeText={setMessage} placeholder={t('settings.helpSupport.form.messagePlaceholder')} multiline numberOfLines={6} maxLength={2000} />
            </Card>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('settings.helpSupport.form.emailNotice').replace('{email}', SUPPORT_EMAIL)}</Text>
            <Button title={t('settings.helpSupport.form.send')} onPress={submit} loading={sending} disabled={sending} />
          </KeyboardAwareScrollView>
        </KeyboardAwareView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
