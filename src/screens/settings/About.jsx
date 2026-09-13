import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { FileText, ShieldCheck } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

// Version is read from app.config.js via Constants.expoConfig.version so it
// never drifts out of sync with the actual build.
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function About() {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={t('settings.about')} subtitle={t('settings.aboutDesc')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <Card style={{ alignItems: 'center', gap: spacing.xs }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radii.lg,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('../../../assets/icon.png')}
                style={{ width: 64, height: 64 }}
                resizeMode="cover"
              />
            </View>
            <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.sm }]}>AsaanKhata</Text>
            <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('settings.about.tagline')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs }]}>{t('settings.about.version').replace('{version}', APP_VERSION)}</Text>
          </Card>

          <View>
            <SectionHeader title={t('settings.about.legal')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                style={{ flexDirection: rowDirection }}
                leading={
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radii.md,
                      backgroundColor: colors.surface.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={18} color={colors.ink.secondary} strokeWidth={1.8} />
                  </View>
                }
                title={t('auth.register3.termsOfService')}
                titleStyle={{ color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }}
                subtitle={t('settings.about.comingSoon')}
              />
              <ListRow
                style={{ flexDirection: rowDirection }}
                leading={
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radii.md,
                      backgroundColor: colors.surface.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={18} color={colors.ink.secondary} strokeWidth={1.8} />
                  </View>
                }
                title={t('auth.register3.privacyPolicy')}
                titleStyle={{ color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }}
                subtitle={t('settings.about.comingSoon')}
              />
            </Card>
          </View>

          <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>
            {t('settings.about.copyright').replace('{year}', new Date().getFullYear())}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
