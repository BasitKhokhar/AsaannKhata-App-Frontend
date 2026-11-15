const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';
const MLKIT_SCANNER_ACTIVITY = 'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';

module.exports = function withAndroidLargeScreenSupport(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || TOOLS_NAMESPACE;
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(modConfig.modResults);
    delete mainActivity.$['android:screenOrientation'];
    mainActivity.$['android:resizeableActivity'] = 'true';

    const application = manifest.application[0];
    application.activity = application.activity || [];
    let scannerActivity = application.activity.find((activity) => activity.$?.['android:name'] === MLKIT_SCANNER_ACTIVITY);
    if (!scannerActivity) {
      scannerActivity = { $: { 'android:name': MLKIT_SCANNER_ACTIVITY } };
      application.activity.push(scannerActivity);
    }
    const removed = new Set((scannerActivity.$['tools:remove'] || '').split(',').filter(Boolean));
    removed.add('android:screenOrientation');
    scannerActivity.$['tools:remove'] = Array.from(removed).join(',');
    return modConfig;
  });
};
