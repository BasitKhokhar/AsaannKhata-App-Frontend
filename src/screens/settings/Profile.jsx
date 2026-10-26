import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Store, KeyRound } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/authApi';
import * as secureSession from '../../services/secureSession';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

// The client only has session data ({ name, email, adminId }) in memory —
// there's no GET /admin/profile endpoint to fetch a fuller profile from.
// Shop editing lives in the existing Shops screens, not here.
export default function Profile() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { name, email, adminId } = useAuthStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const updatePassword = useMutation({
    mutationFn: () => authApi.updatePassword({ currentPassword, newPassword }),
    onSuccess: async () => {
      await secureSession.clearSession();
      useAuthStore.getState().clearSession();
      setCurrentPassword('');
      setNewPassword('');
      setFormError(null);
      showToast(t('settings.profile.passwordUpdated'), 'success');
    },
    onError: (err) => {
      setFormError(err?.response?.data?.message || t('settings.profile.errorGeneric'));
    },
  });

  function handleUpdatePassword() {
    if (!currentPassword || !newPassword) {
      setFormError(t('settings.profile.errorFillBoth'));
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      setFormError(t('settings.profile.errorMinLength'));
      return;
    }
    setFormError(null);
    updatePassword.mutate();
  }

  const initials = (name || email || '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('settings.profile')} subtitle={t('settings.profileDesc')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <Card style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[typography.h2, { color: colors.ink.onBrand }]}>{initials}</Text>
            </View>
            <Text style={[typography.h2, { color: colors.ink.primary, textAlign: 'center' }]}>{name || t('settings.profile.defaultName')}</Text>
            <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{email || t('settings.profile.noEmail')}</Text>
            {adminId ? (
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('settings.profile.accountId').replace('{id}', adminId)}</Text>
            ) : null}
          </Card>

          <View>
            <SectionHeader title={t('settings.profile.shopManagement')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                onPress={() => navigation.navigate('ShopsStack', { screen: 'ShopsList' })}
                style={{ flexDirection: rowDirection }}
                leading={
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radii.md,
                      backgroundColor: colors.brand.primary + '1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Store size={18} color={colors.brand.primary} strokeWidth={1.8} />
                  </View>
                }
                title={t('nav.myShops')}
                subtitle={t('settings.profile.myShopsDesc')}
                titleStyle={{ textAlign }}
                showChevron
              />
            </Card>
          </View>

          <View>
            <SectionHeader title={t('settings.profile.changePassword')} style={{ flexDirection: rowDirection }} />
            <Card style={{ gap: spacing.md }}>
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radii.md,
                    backgroundColor: colors.brand.primary + '1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={16} color={colors.brand.primary} strokeWidth={1.8} />
                </View>
                <Text style={[typography.caption, { color: colors.ink.secondary, flex: 1, textAlign }]}>
                  {t('settings.profile.changePasswordDesc')}
                </Text>
              </View>

              <TextField
                label={t('settings.profile.currentPassword')}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                secureTextEntry
                style={{ textAlign }}
              />
              <TextField
                label={t('settings.profile.newPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('settings.profile.newPasswordHint')}
                secureTextEntry
                style={{ textAlign }}
              />
              {formError ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{formError}</Text> : null}
              <Button title={t('settings.profile.updatePassword')} onPress={handleUpdatePassword} loading={updatePassword.isPending} variant="outline" />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
