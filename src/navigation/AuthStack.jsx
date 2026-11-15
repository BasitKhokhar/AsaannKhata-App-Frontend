import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import RegisterStep1 from '../screens/auth/RegisterStep1';
import RegisterStep2 from '../screens/auth/RegisterStep2';
import RegisterStep3 from '../screens/auth/RegisterStep3';
import ForgotPassword from '../screens/auth/ForgotPassword';
import OtpVerification from '../screens/auth/OtpVerification';
import { useOnboardingStore } from '../store/onboardingStore';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  const authEntryRoute = useOnboardingStore((s) => s.authEntryRoute);
  const consumeAuthEntryRoute = useOnboardingStore((s) => s.consumeAuthEntryRoute);
  const initialRouteName = authEntryRoute || 'Login';

  useEffect(() => {
    if (authEntryRoute) consumeAuthEntryRoute();
  }, [authEntryRoute, consumeAuthEntryRoute]);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2} />
      <Stack.Screen name="RegisterStep3" component={RegisterStep3} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
    </Stack.Navigator>
  );
}
