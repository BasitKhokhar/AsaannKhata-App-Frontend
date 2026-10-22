import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

let configured = false;
let identityQueue = Promise.resolve();

function customerId(adminId) {
  const id = String(adminId ?? '');
  if (!/^[1-9]\d*$/.test(id)) throw new Error('A valid account is required for purchases');
  return id;
}

function configureRevenueCat(adminId) {
  if (configured) return;
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    throw new Error('In-app purchases require Android or iOS');
  }
  const extra = Constants.expoConfig?.extra || {};
  const apiKey = Platform.OS === 'ios' ? extra.revenueCatIosSdkKey : extra.revenueCatAndroidSdkKey;
  if (!apiKey) throw new Error(`RevenueCat ${Platform.OS} SDK key is not configured`);
  // Never create an anonymous customer: purchases must belong to our Admin.id.
  Purchases.configure({ apiKey, appUserID: customerId(adminId) });
  configured = true;
}

// The backend maps webhook app_user_id to Admin.id.
export function loginRevenueCat(adminId) {
  const id = customerId(adminId);
  const operation = identityQueue.catch(() => {}).then(async () => {
    configureRevenueCat(id);
    if (await Purchases.getAppUserID() !== id) await Purchases.logIn(id);
  });
  identityQueue = operation;
  return operation;
}

export async function logoutRevenueCat() {
  const operation = identityQueue.catch(() => {}).then(async () => {
    if (configured) await Purchases.logOut();
  });
  identityQueue = operation;
  return operation;
}

export async function getOfferings(adminId) {
  await loginRevenueCat(adminId);
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg, adminId) {
  await loginRevenueCat(adminId);
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases(adminId) {
  await loginRevenueCat(adminId);
  return Purchases.restorePurchases();
}
