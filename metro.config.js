const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// Drizzle's expo-sqlite migrator imports .sql migration files directly
// (see src/db/migrations/migrations.js) — Metro needs to treat them as a
// source extension so it bundles their raw text content.
config.resolver.sourceExts.push('sql');

module.exports = config;
