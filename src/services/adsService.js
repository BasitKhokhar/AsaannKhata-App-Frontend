import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { InteractionManager } from 'react-native';
import mobileAds, {
  MaxAdContentRating,
  TestIds,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { entitlementRepository } from '../db/repositories/entitlementRepository';
import { useCoinsStore } from '../store/coinsStore';
import { adsApi } from './adsApi';
import { isAdSupportedEntitlement } from '../utils/entitlements';

// Ported from AttaChaki's ads layer, adapted to this app's own conventions
// (Constants.expoConfig.extra for ad unit ids, entitlementRepository for the
// paid-plan gate, a Zustand-persisted store instead of a bare AsyncStorage
// key for pacing counters).

const INTERSTITIAL_COOLDOWN_MS = 90 * 1000; // 90 seconds between eligible completion breaks
const INTERSTITIAL_WATCHDOG_MS = 4000; // never let an interstitial block navigation longer than this
const INTERSTITIAL_RETRY_DELAY_MS = 5000;
const MAX_INTERSTITIAL_LOAD_RETRIES = 2;

const MAX_CONSECUTIVE_REWARDED_ADS = 3;
const REWARDED_BATCH_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function extra() {
  return Constants.expoConfig?.extra || {};
}

// __DEV__ substitutes Google's sample TestIds so development builds never
// request real inventory against the production unit ids from .env.
export function getAdUnitId(kind) {
  if (__DEV__) {
    switch (kind) {
      case 'banner':
        return TestIds.BANNER;
      case 'interstitial':
        return TestIds.INTERSTITIAL;
      case 'rewarded':
        return TestIds.REWARDED;
      default:
        return TestIds.BANNER;
    }
  }
  const ex = extra();
  switch (kind) {
    case 'banner':
      return ex.bannerAdUnitId;
    case 'interstitial':
      return ex.interstitialAdUnitId;
    case 'rewarded':
      return ex.rewardAdUnitId;
    default:
      return null;
  }
}

let initPromise = null;

// Call once at app startup (see App.jsx) — idempotent, safe to call again.
export function initAds() {
  if (initPromise) return initPromise;
  initPromise = mobileAds()
    .setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    })
    .then(() => mobileAds().initialize());
  return initPromise;
}

async function isOnline() {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable !== false);
}

// Every ad entry point gates here first. Paid Lifetime Offline is ad-free even
// though cloudEnabled is false, so eligibility comes from the plan helper.
export async function canShowAds() {
  if (!isAdSupportedEntitlement(entitlementRepository.get())) return false;
  return isOnline();
}

// ---------------------------------------------------------------------------
// Interstitial: preload-with-retry + cooldown + non-blocking show
// ---------------------------------------------------------------------------

let interstitial = null;
let interstitialLoaded = false;
let interstitialLoading = false;
function loadInterstitial(retriesLeft) {
  const unitId = getAdUnitId('interstitial');
  if (!unitId || interstitialLoading) return;
  interstitialLoading = true;

  const ad = InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: false });
  interstitial = ad;

  const cleanup = () => {
    unsubLoaded();
    unsubError();
  };
  const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
    interstitialLoading = false;
  });
  const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    interstitialLoading = false;
    cleanup();
    if (retriesLeft > 0) {
      setTimeout(() => loadInterstitial(retriesLeft - 1), INTERSTITIAL_RETRY_DELAY_MS);
    }
  });

  ad.load();
}

export function preloadInterstitialAd() {
  canShowAds()
    .then((eligible) => {
      if (eligible && !interstitialLoaded && !interstitialLoading) loadInterstitial(MAX_INTERSTITIAL_LOAD_RETRIES);
    })
    .catch(() => {});
}

// Navigation must never wait for an interstitial. Continue immediately, then
// try to show an already-loaded ad after the transition has settled. If no ad
// is ready (or AdMob has no inventory), navigation has already completed and
// the next preload happens in the background.
export function showInterstitialThenContinue(proceed, { requirePriorShow = false } = {}) {
  try {
    proceed();
  } catch (err) {
    // Preserve the caller's navigation error semantics without allowing ad
    // handling to create a second navigation attempt.
    return;
  }

  InteractionManager.runAfterInteractions(() => {
    void showInterstitialIfReady({ requirePriorShow });
  });
}

let interstitialShowing = false;

async function showInterstitialIfReady({ requirePriorShow = false } = {}) {
  if (interstitialShowing) return;

  try {
    const { lastInterstitialShownAt } = useCoinsStore.getState();
    const offCooldown = Date.now() - (lastInterstitialShownAt || 0) >= INTERSTITIAL_COOLDOWN_MS;
    const hasRequiredPriorShow = !requirePriorShow || !!lastInterstitialShownAt;
    const eligible = hasRequiredPriorShow && offCooldown && interstitialLoaded && interstitial && (await canShowAds());

    if (!eligible) {
      preloadInterstitialAd();
      return;
    }

    const ad = interstitial;
    interstitialShowing = true;
    interstitialLoaded = false;
    let settled = false;
    let watchdog;
    const finish = (wasShown) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      unsubClosed?.();
      unsubError?.();
      interstitialShowing = false;
      if (wasShown) useCoinsStore.getState().setLastInterstitialShownAt(Date.now());
      preloadInterstitialAd();
    };
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    watchdog = setTimeout(() => finish(false), INTERSTITIAL_WATCHDOG_MS);

    await ad.show();
  } catch (err) {
    interstitialShowing = false;
    interstitialLoaded = false;
    preloadInterstitialAd();
  }
}

// ---------------------------------------------------------------------------
// Rewarded: only awards coins after the SDK's real EARNED_REWARD event, with
// anti-farming batch pacing tracked in the persisted coins store.
// ---------------------------------------------------------------------------

let rewarded = null;
let rewardedLoaded = false;
let rewardedLoading = false;

function loadRewarded() {
  const unitId = getAdUnitId('rewarded');
  if (!unitId || rewardedLoading) return;
  rewardedLoading = true;

  const ad = RewardedAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: false });
  rewarded = ad;

  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
    rewardedLoading = false;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    rewardedLoading = false;
  });

  ad.load();
}

export function preloadRewardedAd() {
  if (!rewardedLoaded && !rewardedLoading) loadRewarded();
}

function isRewardedBatchOnCooldown() {
  const { rewardedCooldownUntil } = useCoinsStore.getState();
  return !!rewardedCooldownUntil && Date.now() < rewardedCooldownUntil;
}

// After MAX_CONSECUTIVE_REWARDED_ADS watched back-to-back, forces a
// REWARDED_BATCH_COOLDOWN_MS pause before another one can be requested —
// makes ad-farming loops unattractive without punishing normal usage.
function recordRewardedAdShown() {
  const { consecutiveRewardedAds, setRewardedPacing } = useCoinsStore.getState();
  const next = (consecutiveRewardedAds || 0) + 1;
  if (next >= MAX_CONSECUTIVE_REWARDED_ADS) {
    setRewardedPacing({ consecutiveRewardedAds: 0, rewardedCooldownUntil: Date.now() + REWARDED_BATCH_COOLDOWN_MS });
  } else {
    setRewardedPacing({ consecutiveRewardedAds: next });
  }
}

export function rewardedAdAvailability() {
  if (isRewardedBatchOnCooldown()) return { available: false, reason: 'cooldown' };
  const { adsRemainingToday } = useCoinsStore.getState();
  if (adsRemainingToday <= 0) return { available: false, reason: 'daily_cap' };
  return { available: true };
}

// Shows a rewarded ad. Only calls the backend POST /ads/reward — and only
// merges its response into coinsStore — when the SDK's own EARNED_REWARD
// event actually fired. Coins are NEVER awarded client-side.
export async function showRewardedAd() {
  const { available, reason } = rewardedAdAvailability();
  if (!available) return { wasShown: false, earned: false, reason };
  if (!(await canShowAds())) return { wasShown: false, earned: false, reason: 'offline_or_paid' };
  if (!rewardedLoaded || !rewarded) {
    preloadRewardedAd();
    return { wasShown: false, earned: false, reason: 'not_ready' };
  }

  const ad = rewarded;
  return new Promise((resolve) => {
    let earned = false;

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, async () => {
      unsubEarned();
      unsubClosed();
      rewardedLoaded = false;
      recordRewardedAdShown();
      preloadRewardedAd(); // queue the next one

      if (!earned) {
        resolve({ wasShown: true, earned: false });
        return;
      }
      try {
        const result = await adsApi.reportAdReward();
        useCoinsStore.getState().applyRewardResult(result);
        resolve({ wasShown: true, earned: true });
      } catch (err) {
        resolve({ wasShown: true, earned: false, error: err });
      }
    });

    ad.show().catch(() => {
      unsubEarned();
      unsubClosed();
      resolve({ wasShown: false, earned: false });
    });
  });
}

export const adsService = {
  initAds,
  canShowAds,
  getAdUnitId,
  preloadInterstitialAd,
  showInterstitialThenContinue,
  preloadRewardedAd,
  rewardedAdAvailability,
  showRewardedAd,
};
