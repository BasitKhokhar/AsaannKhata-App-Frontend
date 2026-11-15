const test = require('node:test');
const assert = require('node:assert/strict');
const { enableOptimizingR8Profile, removeDeprecatedEdgeToEdgeItems } = require('../plugins/withAndroidReleaseHardening');

test('removes deprecated edge-to-edge theme attributes', () => {
  const resources = { style: [{ item: [
    { $: { name: 'android:statusBarColor' } },
    { $: { name: 'android:navigationBarColor' } },
    { $: { name: 'colorPrimary' } },
  ] }] };
  removeDeprecatedEdgeToEdgeItems(resources);
  assert.deepEqual(resources.style[0].item.map((item) => item.$.name), ['colorPrimary']);
});

test('uses the optimizing R8 profile', () => {
  const gradle = { language: 'groovy', contents: 'proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"' };
  enableOptimizingR8Profile(gradle);
  assert.match(gradle.contents, /proguard-android-optimize\.txt/);
});
