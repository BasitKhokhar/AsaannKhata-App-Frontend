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
import { showToast } from '../../store/toastStore';

// The client only has session data ({ name, email, adminId }) in memory —
// there's no GET /admin/profile endpoint to fetch a fuller profile from.
// Shop editing lives in the existing Shops screens, not here.
export default function Profile() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { name, email, adminId } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const updatePassword = useMutation({
    mutationFn: () => authApi.updatePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setFormError(null);
      showToast('Password updated', 'success');
    },
    onError: (err) => {
      setFormError(err?.response?.data?.message || 'Could not update password. Check your current password and try again.');
    },
  });

  function handleUpdatePassword() {
    if (!currentPassword || !newPassword) {
      setFormError('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
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
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Profile" subtitle="Your account & shop details" />
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
            <Text style={[typography.h2, { color: colors.ink.primary, textAlign: 'center' }]}>{name || 'Shop Owner'}</Text>
            <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{email || 'No email on file'}</Text>
            {adminId ? (
              <Text style={[typography.caption, { color: colors.ink.secondary }]}>Account ID: {adminId}</Text>
            ) : null}
          </Card>

          <View>
            <SectionHeader title="Shop Management" />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                onPress={() => navigation.navigate('ShopsStack', { screen: 'ShopsList' })}
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
                title="My Shops"
                subtitle="View, edit, or add shops"
                showChevron
              />
            </Card>
          </View>

          <View>
            <SectionHeader title="Change Password" />
            <Card style={{ gap: spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
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
                <Text style={[typography.caption, { color: colors.ink.secondary, flex: 1 }]}>
                  Update the password used to sign in to AsaanKhata.
                </Text>
              </View>

              <TextField
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                secureTextEntry
              />
              <TextField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
              />
              {formError ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{formError}</Text> : null}
              <Button title="Update Password" onPress={handleUpdatePassword} loading={updatePassword.isPending} variant="outline" />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
