const { withAndroidStyles, withAppBuildGradle } = require('expo/config-plugins');

const DEPRECATED_EDGE_TO_EDGE_ITEMS = new Set([
  'android:statusBarColor',
  'android:navigationBarColor',
  'android:enforceStatusBarContrast',
  'android:enforceNavigationBarContrast',
]);

function removeDeprecatedEdgeToEdgeItems(resources) {
  for (const style of resources.style || []) {
    style.item = (style.item || []).filter((item) => !DEPRECATED_EDGE_TO_EDGE_ITEMS.has(item.$?.name));
  }
  return resources;
}

function enableOptimizingR8Profile(buildGradle) {
  if (buildGradle.language !== 'groovy') throw new Error('Android release hardening requires a Groovy app/build.gradle file.');
  const current = 'getDefaultProguardFile("proguard-android.txt")';
  const optimized = 'getDefaultProguardFile("proguard-android-optimize.txt")';
  if (buildGradle.contents.includes(current)) buildGradle.contents = buildGradle.contents.replace(current, optimized);
  else if (!buildGradle.contents.includes(optimized)) throw new Error('Unable to locate the Android release ProGuard profile.');
  return buildGradle;
}

module.exports = function withAndroidReleaseHardening(config) {
  config = withAndroidStyles(config, (modConfig) => {
    removeDeprecatedEdgeToEdgeItems(modConfig.modResults.resources);
    return modConfig;
  });
  return withAppBuildGradle(config, (modConfig) => {
    enableOptimizingR8Profile(modConfig.modResults);
    return modConfig;
  });
};

module.exports.removeDeprecatedEdgeToEdgeItems = removeDeprecatedEdgeToEdgeItems;
module.exports.enableOptimizingR8Profile = enableOptimizingR8Profile;
