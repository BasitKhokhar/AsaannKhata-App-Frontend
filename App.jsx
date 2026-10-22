import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from './src/theme/typography';

import { ThemeProvider } from './src/theme';
import { useDbMigrations } from './src/db/migrator';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useCoinsStore } from './src/store/coinsStore';
import * as secureSession from './src/services/secureSession';
import { useSyncTriggers } from './src/sync/triggers';
import { initAds } from './src/services/adsService';
import { initAnalytics } from './src/services/analyticsService';
import { initFcm } from './src/services/fcmService';
import { loginRevenueCat } from './src/services/revenueCat';
import { Toast } from './src/components/ui/Toast';
import { ConfirmDialog } from './src/components/ui/ConfirmDialog';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  const { success: migrationsReady, error: migrationError } = useDbMigrations();

  const setSession = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    secureSession
      .loadSession()
      .then(async (session) => {
        if (session) {
          await useCoinsStore.persist.rehydrate();
          useCoinsStore.getState().setOwner(session.adminId);
          setSession(session);
          // Billing/network availability must not block offline startup.
          loginRevenueCat(session.adminId).catch(() => {});
        }
      })
      .finally(() => {
        setHydrated(true);
        setSessionChecked(true);
      });
  }, []);

  const ready = fontsLoaded && migrationsReady && sessionChecked && isHydrated;

  useSyncTriggers(migrationsReady);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useAuthStore.getState().adminId) {
        queryClient.invalidateQueries({ queryKey: ['entitlement'] });
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Fire-and-forget: never gates `ready`/splash-hide on ad SDK init, since
    // ads are a free-tier extra, not something the app depends on to run.
    initAds().catch(() => {});
    // Same treatment for analytics + push — neither should block first
    // paint, and both are best-effort by design (see their own files).
    initAnalytics().catch(() => {});
    initFcm().catch(() => {});
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  if (migrationError) {
    // Local DB failed to migrate — nothing in the app can work without it.
    // A dedicated recovery screen is a future improvement; for now this
    // avoids silently rendering an app with a broken data layer.
    throw migrationError;
  }

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootNavigator />
            <Toast />
            <ConfirmDialog />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
