import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// Set these once you've created the app in the RevenueCat dashboard —
// separate keys per store, both required before any purchase flow works.
const REVENUECAT_API_KEYS = {
  ios: 'REVENUECAT_IOS_SDK_KEY',
  android: 'REVENUECAT_ANDROID_SDK_KEY',
};

let configured = false;

// Call once at app startup, before the first Purchases.* call of any kind.
export function configureRevenueCat() {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
  Purchases.configure({ apiKey });
  configured = true;
}

// MUST be called right after every successful backend login/registration —
// this is how RevenueCat's app_user_id is set to match the backend Admin.id,
// which is how the /webhooks/revenuecat handler maps a purchase to a tenant.
export async function loginRevenueCat(adminId) {
  configureRevenueCat();
  await Purchases.logIn(String(adminId));
}

export async function getOfferings() {
  configureRevenueCat();
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg) {
  configureRevenueCat();
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  configureRevenueCat();
  return Purchases.restorePurchases();
}
