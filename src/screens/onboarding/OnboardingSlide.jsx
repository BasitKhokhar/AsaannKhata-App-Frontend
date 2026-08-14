import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggerIn } from '../../components/motion/StaggerIn';
import { ProgressDots } from '../../components/motion/ProgressDots';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';

const TOTAL_SLIDES = 4;

function tapHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

// Shared chrome for all 4 onboarding slides — skip button, illustration
// slot, title/description, progress dots, and the Back/Next/Get Started CTAs.
export function OnboardingSlide({ index, illustration, title, description, isLast, nextRoute }) {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  function finishOnboarding() {
    tapHaptic();
    completeOnboarding();
    // RootNavigator swaps to AuthStack automatically once hasSeenOnboarding
    // flips — no explicit navigation call needed here.
  }

  function handleNext() {
    tapHaptic();
    if (isLast) {
      finishOnboarding();
    } else {
      navigation.navigate(nextRoute);
    }
  }

  function handleBack() {
    tapHaptic();
    navigation.goBack();
  }

  const ctaGlowColor = isLast ? colors.brand.accent : colors.brand.primary;

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

        <StaggerIn delay={0} distance={20} style={styles.illustrationArea}>
          {illustration}
        </StaggerIn>

        <StaggerIn delay={160} distance={16} style={{ paddingHorizontal: spacing.xxl, alignItems: 'center' }}>
          <Text style={[typography.h1, { color: colors.ink.primary, textAlign: 'center' }]}>{title}</Text>
          <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.sm }]}>
            {description}
          </Text>
        </StaggerIn>

        <ProgressDots count={TOTAL_SLIDES} activeIndex={index} />

        <StaggerIn
          delay={240}
          distance={12}
          style={{ flexDirection: 'row', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
        >
          {index > 0 && (
            <Button
              title="Back"
              variant="outline"
              onPress={handleBack}
              style={{ width: 96, marginRight: spacing.sm }}
            />
          )}
          <Button
            title={isLast ? 'Get Started' : 'Next'}
            variant={isLast ? 'accent' : 'primary'}
            onPress={handleNext}
            style={{
              flex: 1,
              shadowColor: ctaGlowColor,
              shadowOpacity: 0.45,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          />
        </StaggerIn>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  illustrationArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
