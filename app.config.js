require("dotenv").config();
const withKotlinSkipMetadataVersionCheck = require("./plugins/withKotlinSkipMetadataVersionCheck");

// Falls back to the Android emulator alias when EXPO_PUBLIC_API_BASE_URL
// isn't set. Set the real value in the EAS "development"/"preview"/
// "production" environment (eas.json already tags each build profile with
// its environment) so it's baked into `extra` at build time and readable
// at runtime even when a bundled .env isn't shipped with the build.
const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:5000";

module.exports = ({ config }) => ({
  ...config,
  expo: {
    name: "AsaanKhata",
    slug: "asaankhataapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    owner: "basit5000",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.asaankhata.app",
    },
    android: {
      package: "com.asaankhata.app",
      // Placeholder committed at repo root (mismatched package name, from a
      // sister app) until the user swaps in the real Firebase config for
      // com.asaankhata.app — referenced only via this standard path, never
      // read/parsed by our own code.
      googleServicesFile: "./google-services.json",
      // Play Data Safety hardening — this app's own backup story is the
      // server (cloud sync), not Android's auto-backup of local SQLite/
      // AsyncStorage, which could otherwise leak business data to a Google
      // Drive backup outside our control.
      allowBackup: false,
      // Explicit allow-list beyond whatever expo-image-picker/expo-sqlite/
      // etc. already declare for themselves: INTERNET for all API/sync/ads/
      // Firebase traffic, POST_NOTIFICATIONS for FCM's Android 13+ runtime
      // permission. Camera/location/storage/bluetooth are deliberately not
      // requested — nothing in this app uses them. react-native-google-
      // mobile-ads and @react-native-firebase/* will still merge in their
      // own required permissions (e.g. AD_ID, ACCESS_NETWORK_STATE) — that's
      // expected and not blocked.
      permissions: ["INTERNET", "POST_NOTIFICATIONS"],
      adaptiveIcon: {
        backgroundColor: "#151E33",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-sqlite",
      "expo-secure-store",
      "expo-font",
      // @react-native-firebase/messaging ships no config plugin of its own —
      // it only needs the native Firebase app instance this plugin sets up
      // plus the googleServicesFile above.
      "@react-native-firebase/app",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#151E33",
          image: "./assets/splash-icon.png",
          imageWidth: 160,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "AsaanKhata uses your photos to set product images and shop logos.",
        },
      ],
      "expo-sharing",
      "expo-file-system",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.GOOGLE_ADMOB_ANDROID_APP_ID,
        },
      ],
      withKotlinSkipMetadataVersionCheck,
    ],
    extra: {
      apiBaseUrl,
      googleAdmobAndroidAppId: process.env.GOOGLE_ADMOB_ANDROID_APP_ID,
      bannerAdUnitId: process.env.BANNER_AD_UNIT_ID,
      interstitialAdUnitId: process.env.INTERSTITIAL_AD_UNIT_ID,
      rewardAdUnitId: process.env.REWARD_AD_UNIT_ID,
      eas: {
        projectId: process.env.EXPO_ID,
      },
    },
  },
});
