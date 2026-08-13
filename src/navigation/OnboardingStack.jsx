import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screens/onboarding/Splash';
import Onboarding1 from '../screens/onboarding/Onboarding1';
import Onboarding2 from '../screens/onboarding/Onboarding2';
import Onboarding3 from '../screens/onboarding/Onboarding3';
import Onboarding4 from '../screens/onboarding/Onboarding4';

const Stack = createNativeStackNavigator();

// Shown once, before the very first login/register — Splash auto-advances
// into the 4-slide carousel, which ends by handing off to AuthStack's Login
// (see Onboarding4's "Get Started" action) after flipping hasSeenOnboarding.
export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Onboarding1" component={Onboarding1} />
      <Stack.Screen name="Onboarding2" component={Onboarding2} />
      <Stack.Screen name="Onboarding3" component={Onboarding3} />
      <Stack.Screen name="Onboarding4" component={Onboarding4} />
    </Stack.Navigator>
  );
}
