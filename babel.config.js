module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Lets Drizzle's expo-sqlite migrator `import` raw .sql migration
      // files as strings (see src/db/migrations/migrations.js).
      ['inline-import', { extensions: ['.sql'] }],
      // Reanimated v4 extracted its worklets transform into react-native-worklets —
      // using the old react-native-reanimated/plugin here would silently stop
      // transforming worklets. Must be the LAST plugin in this array.
      'react-native-worklets/plugin',
    ],
  };
};
