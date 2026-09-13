import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../../theme';
import { useEntitlement } from '../../hooks/useEntitlement';
import { getAdUnitId } from '../../services/adsService';

// Adaptive banner, auto-hidden when offline or on a paid/cloud plan. Mount
// this only on screens that are safe to interrupt (e.g. Dashboard) — never
// on billing/checkout screens, so an ad can't ever appear mid-sale.
export function AdBanner({ style }) {
  const { spacing } = useTheme();
  const { data: entitlement } = useEntitlement();
  const [online, setOnline] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  const isPaidPlan = !!entitlement?.cloudEnabled;
  if (isPaidPlan || !online || failed) return null;

  const unitId = getAdUnitId('banner');
  if (!unitId) return null;

  return (
    <View style={[{ alignItems: 'center', marginVertical: spacing.sm }, style]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
