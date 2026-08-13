import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { ProgressDots } from '../../components/motion/ProgressDots';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_SLIDES = 4;

// Shared chrome for all 4 onboarding slides — skip button, illustration
// slot, title/description, progress dots, and the Next/Get Started CTA.
export function OnboardingSlide({ index, illustration, title, description, isLast, nextRoute }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  function finishOnboarding() {
    completeOnboarding();
    // RootNavigator swaps to AuthStack automatically once hasSeenOnboarding
    // flips — no explicit navigation call needed here.
  }

  function handleNext() {
    if (isLast) {
      finishOnboarding();
    } else {
      navigation.navigate(nextRoute);
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topRow}>
          {!isLast ? (
            <Pressable onPress={finishOnboarding} hitSlop={8}>
              <Text style={[typography.bodyMedium, { color: colors.ink.secondary }]}>Skip</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        <View style={styles.illustrationArea}>{illustration}</View>

        <View style={{ paddingHorizontal: spacing.xxl, alignItems: 'center' }}>
          <Text style={[typography.h1, { color: colors.ink.primary, textAlign: 'center' }]}>{title}</Text>
          <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.sm }]}>
            {description}
          </Text>
        </View>

        <ProgressDots count={TOTAL_SLIDES} activeIndex={index} />

        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
          <Button
            title={isLast ? 'Get Started' : 'Next'}
            variant={isLast ? 'accent' : 'primary'}
            onPress={handleNext}
          />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  illustrationArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
