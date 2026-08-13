import * as SecureStore from 'expo-secure-store';

// Tokens are sensitive and short-lived-ish (15/180 day JWTs) — SecureStore
// (Keychain/Keystore-backed) is the right place for them, not AsyncStorage.
const KEYS = {
  accessToken: 'ak_access_token',
  refreshToken: 'ak_refresh_token',
  adminId: 'ak_admin_id',
  email: 'ak_email',
  name: 'ak_name',
};

export async function saveSession({ accessToken, refreshToken, adminId, email, name }) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    SecureStore.setItemAsync(KEYS.adminId, String(adminId)),
    email != null && SecureStore.setItemAsync(KEYS.email, email),
    name != null && SecureStore.setItemAsync(KEYS.name, name),
  ]);
}

export async function loadSession() {
  const [accessToken, refreshToken, adminId, email, name] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.adminId),
    SecureStore.getItemAsync(KEYS.email),
    SecureStore.getItemAsync(KEYS.name),
  ]);
  if (!accessToken || !refreshToken || !adminId) return null;
  return { accessToken, refreshToken, adminId: parseInt(adminId, 10), email, name };
}

export async function updateTokens({ accessToken, refreshToken }) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
  ]);
}

export async function clearSession() {
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}
