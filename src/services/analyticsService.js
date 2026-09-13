import analytics from '@react-native-firebase/analytics';

// Thin wrapper around @react-native-firebase/analytics — mirrors adsService's
// shape (a handful of plain exported functions plus a grouped default-ish
// object) so call sites never touch the native module directly. Every
// function is best-effort and swallows its own errors: analytics must never
// be the reason a screen or user action fails.

let initPromise = null;

// Call once at app startup (see App.jsx, alongside initAds()) — idempotent.
export function initAnalytics() {
  if (initPromise) return initPromise;
  initPromise = analytics()
    .setAnalyticsCollectionEnabled(true)
    .catch(() => {});
  return initPromise;
}

// Wired into RootNavigator's onStateChange for automatic screen tracking —
// see src/navigation/RootNavigator.jsx.
export function logScreenView(screenName) {
  if (!screenName) return;
  analytics()
    .logScreenView({ screen_name: screenName, screen_class: screenName })
    .catch(() => {});
}

export function logEvent(name, params) {
  if (!name) return;
  analytics()
    .logEvent(name, params)
    .catch(() => {});
}

export function setUserProperty(name, value) {
  if (!name) return;
  analytics()
    .setUserProperty(name, value == null ? null : String(value))
    .catch(() => {});
}

// Call after login/session-hydration with the account id, and with `null`
// on logout to stop attributing further events to that user.
export function setAnalyticsUserId(id) {
  analytics()
    .setUserId(id == null ? null : String(id))
    .catch(() => {});
}

export const analyticsService = {
  initAnalytics,
  logScreenView,
  logEvent,
  setUserProperty,
  setAnalyticsUserId,
};
