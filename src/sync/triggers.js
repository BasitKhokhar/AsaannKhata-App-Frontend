import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { runSync } from './syncEngine';
import { useAuthStore } from '../store/authStore';

const FOREGROUND_INTERVAL_MS = 5 * 60 * 1000;

// Mounted once near the app root (see App.jsx) — funnels every sync trigger
// (foreground, reconnect, 5-min interval) through the same runSync() so
// there's one code path, matching the "Sync Now" button's manual call.
// `enabled` must stay false until DB migrations finish — runSync() reads
// tables (e.g. entitlement_cache) that don't exist until then.
export function useSyncTriggers(enabled) {
  const wasOffline = useRef(false);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    runSync();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSync();
    });

    const netInfoSub = NetInfo.addEventListener((state) => {
      const isOffline = !(state.isConnected && state.isInternetReachable !== false);
      if (wasOffline.current && !isOffline) runSync();
      wasOffline.current = isOffline;
    });

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') runSync();
    }, FOREGROUND_INTERVAL_MS);

    return () => {
      appStateSub.remove();
      netInfoSub();
      clearInterval(interval);
    };
  }, [enabled, isAuthenticated]);
}
