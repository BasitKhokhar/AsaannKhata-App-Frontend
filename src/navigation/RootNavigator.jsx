import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStack } from './OnboardingStack';
import { AuthStack } from './AuthStack';
import { AppDrawer } from './AppDrawer';

// Swaps entire navigator trees based on state resolved before first paint
// (App.jsx holds the splash screen until fonts/migrations/session hydration
// are done) — simpler than gating individual routes for this many
// auth/onboarding/entitlement conditions.
export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  let content;
  if (isAuthenticated) {
    content = <AppDrawer />;
  } else if (!hasSeenOnboarding) {
    content = <OnboardingStack />;
  } else {
    content = <AuthStack />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}
