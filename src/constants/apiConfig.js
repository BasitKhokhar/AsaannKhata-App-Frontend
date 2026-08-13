import Constants from 'expo-constants';

// Backend has NO /api prefix — routes are mounted at root (see app.js).
//
// 10.0.2.2 is the standard alias the Android emulator uses to reach the
// host machine's localhost. For a physical device, replace this with your
// machine's LAN IP (e.g. http://192.168.1.50:5000) — Wi-Fi must be on the
// same network. For production, point this at your deployed API domain.
//
// Resolution order:
// 1. Constants.expoConfig.extra.apiBaseUrl — baked into app.config.js's
//    `extra` from EXPO_PUBLIC_API_BASE_URL at build time. This is what
//    makes the value set via `eas env:create` (per development/preview/
//    production environment) actually reach a development build, since
//    those builds don't ship a local .env.
// 2. process.env.EXPO_PUBLIC_API_BASE_URL — inlined by Metro when running
//    via `expo start` / dev client against a local .env.
// 3. Hardcoded Android emulator default.
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://10.0.2.2:5000';
