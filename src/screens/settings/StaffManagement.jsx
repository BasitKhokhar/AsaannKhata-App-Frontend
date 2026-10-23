import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, ShieldCheck, Users } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function StaffManagement() {
  const { colors, radii, typography, spacing } = useTheme();
  const name = useAuthStore((state) => state.name);
  const email = useAuthStore((state) => state.email);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('settings.staff.title')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={[typography.h3, { color: colors.ink.primary, textAlign }]}>{t('settings.staff.account')}</Text>
          <Card style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.ink.onBrand }]}>{(name || email || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{name || email}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{email}</Text>
            </View>
            <Crown size={20} color={colors.brand.accent} />
          </Card>
          <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <View style={{ width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.semantic.successBg, alignItems: 'center', justifyContent: 'center' }}>
              <Users size={27} color={colors.brand.primary} />
            </View>
            <Text style={[typography.h3, { color: colors.ink.primary, textAlign: 'center' }]}>{t('settings.staff.unavailableTitle')}</Text>
            <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('settings.staff.unavailableDescription')}</Text>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
              <ShieldCheck size={16} color={colors.brand.primary} />
              <Text style={[typography.caption, { color: colors.brand.primary }]}>{t('settings.staff.ownerOnly')}</Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
