import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { OnboardingStack } from './OnboardingStack';
import { AuthStack } from './AuthStack';
import { AppDrawer } from './AppDrawer';
import { logScreenView } from '../services/analyticsService';

// Swaps entire navigator trees based on state resolved before first paint
// (App.jsx holds the splash screen until fonts/migrations/session hydration
// are done) — simpler than gating individual routes for this many
// auth/onboarding/entitlement conditions.
export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  // Automatic screen-view tracking — the exact onStateChange/getCurrentRoute
  // pattern React Navigation's own docs recommend for Firebase Analytics.
  const navigationRef = useRef(null);
  const routeNameRef = useRef();

  let content;
  if (isAuthenticated) {
    content = <AppDrawer />;
  } else if (!hasSeenOnboarding) {
    content = <OnboardingStack />;
  } else {
    content = <AuthStack />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        if (routeNameRef.current) logScreenView(routeNameRef.current);
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        if (currentRouteName && previousRouteName !== currentRouteName) {
          logScreenView(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      {content}
    </NavigationContainer>
  );
}
