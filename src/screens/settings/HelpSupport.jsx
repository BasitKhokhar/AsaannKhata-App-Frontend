import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Mail } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useT, useIsUrdu } from '../../store/languageStore';

// support@asaankhata.app is a placeholder — no real support contact info
// exists anywhere in the codebase yet. Swap this out once one is available.
const SUPPORT_EMAIL = 'support@asaankhata.app';

function FaqRow({ question, answer }) {
  const { colors, radii, typography, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const isUrdu = useIsUrdu();

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
      }}
    >
      <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={[typography.bodyMedium, { color: colors.ink.primary, flex: 1, textAlign: isUrdu ? 'right' : 'left' }]}>{question}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={colors.ink.secondary} />
        </View>
      </View>
      {open ? (
        <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign: isUrdu ? 'right' : 'left' }]}>{answer}</Text>
      ) : null}
    </Pressable>
  );
}

export default function HelpSupport() {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';

  const FAQS = [
    { question: t('settings.helpSupport.faqAddProductQ'), answer: t('settings.helpSupport.faqAddProductA') },
    { question: t('settings.helpSupport.faqKhataQ'), answer: t('settings.helpSupport.faqKhataA') },
    { question: t('settings.helpSupport.faqSyncQ'), answer: t('settings.helpSupport.faqSyncA') },
    { question: t('settings.helpSupport.faqOfflineQ'), answer: t('settings.helpSupport.faqOfflineA') },
    { question: t('settings.helpSupport.faqMultiShopQ'), answer: t('settings.helpSupport.faqMultiShopA') },
  ];

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={t('settings.helpSupport')} subtitle={t('settings.helpSupportDesc')} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <View>
            <SectionHeader title={t('settings.helpSupport.faqTitle')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs, gap: spacing.xs }}>
              {FAQS.map((faq) => (
                <FaqRow key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </Card>
          </View>

          <View>
            <SectionHeader title={t('settings.helpSupport.contactUs')} style={{ flexDirection: rowDirection }} />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
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
                    <Mail size={18} color={colors.brand.primary} strokeWidth={1.8} />
                  </View>
                }
                title={t('settings.helpSupport.emailSupport')}
                subtitle={SUPPORT_EMAIL}
                titleStyle={{ textAlign: isUrdu ? 'right' : 'left' }}
                showChevron
              />
            </Card>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.sm, paddingHorizontal: spacing.md, textAlign: isUrdu ? 'right' : 'left' }]}>
              {t('settings.helpSupport.noPhoneSupport')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
