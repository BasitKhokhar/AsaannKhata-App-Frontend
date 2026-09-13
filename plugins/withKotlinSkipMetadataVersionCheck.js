const { withProjectBuildGradle } = require("expo/config-plugins");

// react-native-google-mobile-ads bundles play-services-ads builds whose
// Kotlin metadata version is newer than what Expo SDK 57's default Kotlin
// compiler can read, and other autolinked modules disagree on which Kotlin
// version to use. Bumping kotlinVersion to chase this has proven unstable
// (newer versions crash expo-modules-core's Fabric codegen). The Kotlin
// compiler itself reports the fix in its own error output, so apply it
// globally instead of fighting version numbers.
const SNIPPET_MARKER = "-Xskip-metadata-version-check";

module.exports = function withKotlinSkipMetadataVersionCheck(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      return config;
    }
    if (config.modResults.contents.includes(SNIPPET_MARKER)) {
      return config;
    }
    config.modResults.contents += `
subprojects { subproject ->
  subproject.tasks.matching { it.name.startsWith("compile") && it.name.endsWith("Kotlin") }.configureEach { task ->
    if (task.hasProperty("compilerOptions")) {
      task.compilerOptions.freeCompilerArgs.addAll(["${SNIPPET_MARKER}"])
    } else if (task.hasProperty("kotlinOptions")) {
      task.kotlinOptions.freeCompilerArgs += ["${SNIPPET_MARKER}"]
    }
  }
}
`;
    return config;
  });
};
