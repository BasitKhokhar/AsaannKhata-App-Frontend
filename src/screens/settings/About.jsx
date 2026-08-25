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

// Version is read from app.config.js via Constants.expoConfig.version so it
// never drifts out of sync with the actual build.
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function About() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="About, Terms & Privacy" subtitle="Version & legal" />
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
            <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>Every Shop. One App.</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs }]}>Version {APP_VERSION}</Text>
          </Card>

          <View>
            <SectionHeader title="Legal" />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
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
                title="Terms of Service"
                titleStyle={{ color: colors.ink.secondary }}
                subtitle="Coming soon"
              />
              <ListRow
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
                title="Privacy Policy"
                titleStyle={{ color: colors.ink.secondary }}
                subtitle="Coming soon"
              />
            </Card>
          </View>

          <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>
            © {new Date().getFullYear()} AsaanKhata. All rights reserved.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
