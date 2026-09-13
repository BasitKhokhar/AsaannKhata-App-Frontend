import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
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

// Ported from AttaChaki's ads layer, adapted to this app's own conventions
// (Constants.expoConfig.extra for ad unit ids, entitlementRepository for the
// paid-plan gate, a Zustand-persisted store instead of a bare AsyncStorage
// key for pacing counters).

const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes between interstitials
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

function isPaidPlan() {
  return !!entitlementRepository.get()?.cloudEnabled;
}

// Every ad-showing entry point in this file gates on this first — cloud/paid
// plans never see ads, and there's no point attempting a network-backed ad
// request while offline.
export async function canShowAds() {
  if (isPaidPlan()) return false;
  return isOnline();
}

// ---------------------------------------------------------------------------
// Interstitial: preload-with-retry + cooldown + non-blocking show
// ---------------------------------------------------------------------------

let interstitial = null;
let interstitialLoaded = false;
let interstitialLoading = false;
let lastInterstitialShownAt = 0;

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
  if (!interstitialLoaded && !interstitialLoading) loadInterstitial(MAX_INTERSTITIAL_LOAD_RETRIES);
}

// Shows the preloaded interstitial if one is ready and the cooldown has
// elapsed, then calls `proceed()`. MUST NEVER block the caller's navigation:
// `proceed()` always fires, either when the ad's CLOSED/ERROR event lands or
// — as a safety net in case those events never fire — when the watchdog
// timer below elapses, whichever comes first.
export async function showInterstitialThenContinue(proceed) {
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    proceed();
  };
  const watchdog = setTimeout(done, INTERSTITIAL_WATCHDOG_MS);

  try {
    const offCooldown = Date.now() - lastInterstitialShownAt >= INTERSTITIAL_COOLDOWN_MS;
    const eligible = offCooldown && interstitialLoaded && interstitial && (await canShowAds());

    if (!eligible) {
      clearTimeout(watchdog);
      done();
      preloadInterstitialAd(); // keep one warm for next time
      return;
    }

    const ad = interstitial;
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClosed();
      unsubError();
      clearTimeout(watchdog);
      lastInterstitialShownAt = Date.now();
      interstitialLoaded = false;
      done();
      preloadInterstitialAd();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubClosed();
      unsubError();
      clearTimeout(watchdog);
      interstitialLoaded = false;
      done();
      preloadInterstitialAd();
    });

    await ad.show();
  } catch (err) {
    clearTimeout(watchdog);
    done();
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
