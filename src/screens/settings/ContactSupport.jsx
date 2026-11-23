import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Sheet } from '../../components/ui/Sheet';
import { TextField } from '../../components/ui/TextField';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../store/toastStore';
import { useIsUrdu, useT } from '../../store/languageStore';
import { notificationsApi } from '../../services/notificationsApi';

const CATEGORY_KEYS = ['app_bug', 'general_question', 'billing', 'account', 'feature_request', 'privacy', 'delete_account', 'other'];

export default function ContactSupport() {
  const route = useRoute();
  const t = useT();
  const isUrdu = useIsUrdu();
  const { colors, typography, spacing, radii } = useTheme();
  const accountEmail = useAuthStore((state) => state.email) || '';
  const requestedCategory = route.params?.category === 'deleteAccount' ? 'delete_account' : route.params?.category;
  const initialCategory = CATEGORY_KEYS.includes(requestedCategory) ? requestedCategory : 'general_question';
  const [category, setCategory] = useState(initialCategory);
  const [categoryOpen, setCategoryOpen] = useState(false);
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

    setSending(true);
    try {
      await notificationsApi.createSupportRequest({
        email: normalizedEmail,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject('');
      setMessage('');
      showToast(t('settings.helpSupport.form.submitted'), 'success');
    } catch (error) {
      showToast(error.response?.data?.message || t('settings.helpSupport.form.submitFailed'), 'danger');
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
              <Text style={[typography.label, { color: colors.ink.primary, textAlign }]}>{t('settings.helpSupport.form.categoryLabel')}</Text>
              <Pressable
                onPress={() => setCategoryOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('settings.helpSupport.form.categoryLabel')}
                style={{ minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, paddingHorizontal: spacing.md, flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={[typography.body, { color: colors.ink.primary }]}>{t(`settings.helpSupport.form.category.${category}`)}</Text>
                <ChevronDown size={18} color={colors.ink.secondary} />
              </Pressable>
              <TextField label={t('settings.helpSupport.form.contactEmail')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextField label={t('settings.helpSupport.form.subject')} value={subject} onChangeText={setSubject} placeholder={t('settings.helpSupport.form.subjectPlaceholder')} maxLength={160} />
              <TextField label={t('settings.helpSupport.form.message')} value={message} onChangeText={setMessage} placeholder={t('settings.helpSupport.form.messagePlaceholder')} multiline numberOfLines={6} maxLength={5000} />
            </Card>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('settings.helpSupport.form.storedNotice')}</Text>
            <Button title={t('settings.helpSupport.form.submit')} onPress={submit} loading={sending} disabled={sending} />
          </KeyboardAwareScrollView>
        </KeyboardAwareView>
      </SafeAreaView>

      <Sheet visible={categoryOpen} onClose={() => setCategoryOpen(false)} title={t('settings.helpSupport.form.categoryLabel')}>
        {CATEGORY_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => { setCategory(key); setCategoryOpen(false); }}
            style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: category === key ? colors.brand.primary + '16' : 'transparent' }}
          >
            <Text style={[typography.bodyMedium, { color: category === key ? colors.brand.primary : colors.ink.primary, textAlign }]}>{t(`settings.helpSupport.form.category.${key}`)}</Text>
          </Pressable>
        ))}
      </Sheet>
    </AnimatedScreen>
  );
}
