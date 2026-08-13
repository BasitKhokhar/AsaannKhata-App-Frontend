require("dotenv").config();

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
    ],
    extra: {
      apiBaseUrl,
      eas: {
        projectId: process.env.EXPO_ID,
      },
    },
  },
});
