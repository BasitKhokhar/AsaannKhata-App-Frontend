import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/services/queryClient';
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
import { useLanguageStore } from './src/store/languageStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { useShopStore } from './src/store/shopStore';
import { useThemeStore } from './src/store/themeStore';
import * as secureSession from './src/services/secureSession';
import { useSyncTriggers } from './src/sync/triggers';
import { initAds } from './src/services/adsService';
import { initAnalytics } from './src/services/analyticsService';
import { initFcm, registerCurrentToken } from './src/services/fcmService';
import { syncLocalLowStockNotifications } from './src/services/localLowStockNotifications';
import { handleInitialNotifeeNotification, subscribeToNotifeeEvents } from './src/services/notifeeService';
import { useNotificationPrefsStore } from './src/store/notificationPrefsStore';
import { loginRevenueCat } from './src/services/revenueCat';
import { refreshEntitlement } from './src/hooks/useEntitlement';
import { Toast } from './src/components/ui/Toast';
import { ConfirmDialog } from './src/components/ui/ConfirmDialog';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 450, fade: true });

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
  const adminId = useAuthStore((s) => s.adminId);
  const activeShopId = useShopStore((s) => s.activeShopId);
  const lowStockAlerts = useNotificationPrefsStore((s) => s.lowStockAlerts);

  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function restoreStartupState() {
      // Zustand's AsyncStorage persistence hydrates asynchronously. Make every
      // preference that affects the first frame explicit startup work so the
      // native splash stays visible until the selected shop palette, mode,
      // language and onboarding state are already available to React.
      const sessionPromise = secureSession.loadSession().catch(() => null);
      await Promise.all([
        useThemeStore.persist.rehydrate(),
        useShopStore.persist.rehydrate(),
        useLanguageStore.persist.rehydrate(),
        useOnboardingStore.persist.rehydrate(),
      ].map((promise) => promise.catch(() => undefined)));

      const session = await sessionPromise;
      if (!session) return;
      await useCoinsStore.persist.rehydrate().catch(() => undefined);
      if (!mounted) return;
      useCoinsStore.getState().setOwner(session.adminId);
      setSession(session);
      // Billing/network availability must not block offline startup.
      loginRevenueCat(session.adminId).catch(() => {});
    }

    restoreStartupState().finally(() => {
      if (mounted) {
        setHydrated(true);
        setSessionChecked(true);
      }
    });

    return () => { mounted = false; };
  }, []);

  // Retry token registration once the signed-in account is available. Push
  // setup is account-scoped and must not depend on active-shop hydration or
  // cloud-sync entitlement.
  useEffect(() => {
    if (!adminId) return undefined;
    registerCurrentToken().catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerCurrentToken().catch(() => {});
    });
    return () => subscription.remove();
  }, [adminId]);

  useEffect(() => {
    if (!migrationsReady || !adminId || !activeShopId) return undefined;
    let cancelled = false;
    const sync = () => {
      if (!cancelled) {
        syncLocalLowStockNotifications({ shopId: activeShopId, enabled: lowStockAlerts }).catch((error) => {
          console.warn('[local-notifications] sync:error', { source: 'frontend-local', message: error?.message });
        });
      }
    };
    sync();
    const interval = setInterval(sync, 5 * 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [migrationsReady, adminId, activeShopId, lowStockAlerts]);

  useEffect(() => {
    const openNotificationTarget = (data = {}) => {
      const url = data.url || data.link || data.externalUrl || data.deepLink;
      if (typeof url !== 'string' || !/^(https?:|[a-z][a-z\d+.-]*:)/i.test(url)) return;
      console.log('[backend-notifications] opening notification URL', { source: data.source || 'unknown', url });
      Linking.openURL(url).catch((error) => {
        console.warn('[backend-notifications] failed to open notification URL', { url, message: error?.message });
      });
    };
    const unsubscribe = subscribeToNotifeeEvents(openNotificationTarget);
    handleInitialNotifeeNotification(openNotificationTarget).catch((error) => {
      console.warn('[backend-notifications] initial notification read failed', { message: error?.message });
    });
    return unsubscribe;
  }, []);

  const ready = fontsLoaded && migrationsReady && sessionChecked && isHydrated;

  useSyncTriggers(migrationsReady);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useAuthStore.getState().adminId) {
        // Refresh immediately on every app resume so a Play Store renewal or
        // backend expiry is visible before the user starts working.
        refreshEntitlement(queryClient).catch(() => {
          // The hook/cache still provide the last safe local entitlement while offline.
        });
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Fire-and-forget: never gates `ready`/splash-hide on ad SDK init, since
    // ads are a free-tier extra, not something the app depends on to run.
    initAds().catch(() => {});
    // Analytics is also best-effort and must not block first paint.
    initAnalytics().catch(() => {});
  }, []);

  useEffect(() => {
    // Push permission belongs to the signed-in account flow. Do not ask on
    // onboarding/login startup; wait until authentication has succeeded.
    if (!adminId) return;
    initFcm().catch(() => {});
  }, [adminId]);

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
