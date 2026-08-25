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

const FAQS = [
  {
    question: 'How do I add a product?',
    answer:
      'Go to Stock from the menu, tap the + button, and fill in the product name, price, quantity, and category. You can add a photo too.',
  },
  {
    question: 'How does khata/credit tracking work?',
    answer:
      'Open a customer from Customers, tap "Add to Khata" to record credit given, or "Record Payment" when they pay it back. The running balance updates automatically.',
  },
  {
    question: 'How do I sync across devices?',
    answer:
      'Cloud Sync keeps your data backed up and available on multiple devices on eligible plans. Turn it on from Sync Status in Settings, then sign in on your other device.',
  },
  {
    question: 'What happens if I lose internet?',
    answer:
      'AsaanKhata works fully offline — bills, stock, and khata entries save to this device instantly and sync to the cloud automatically once you\'re back online.',
  },
  {
    question: 'Can I use AsaanKhata for more than one shop?',
    answer:
      'Yes. Add additional shops from Profile → My Shops, and switch between them from the shop selector in the app menu.',
  },
];

// support@asaankhata.app is a placeholder — no real support contact info
// exists anywhere in the codebase yet. Swap this out once one is available.
const SUPPORT_EMAIL = 'support@asaankhata.app';

function FaqRow({ question, answer }) {
  const { colors, radii, typography, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={[typography.bodyMedium, { color: colors.ink.primary, flex: 1 }]}>{question}</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color={colors.ink.secondary} />
        </View>
      </View>
      {open ? (
        <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.xs }]}>{answer}</Text>
      ) : null}
    </Pressable>
  );
}

export default function HelpSupport() {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Help & Support" subtitle="FAQs and contact" />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg }}>
          <View>
            <SectionHeader title="Frequently Asked Questions" />
            <Card bordered={false} style={{ padding: spacing.xs, gap: spacing.xs }}>
              {FAQS.map((faq) => (
                <FaqRow key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </Card>
          </View>

          <View>
            <SectionHeader title="Contact Us" />
            <Card bordered={false} style={{ padding: spacing.xs }}>
              <ListRow
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
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
                title="Email Support"
                subtitle={SUPPORT_EMAIL}
                showChevron
              />
            </Card>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.sm, paddingHorizontal: spacing.md }]}>
              No phone support line is set up yet — email is the fastest way to reach us for now.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
