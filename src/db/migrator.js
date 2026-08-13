import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from './migrations/migrations';

// Runs pending Drizzle migrations against the local SQLite db on mount.
// App.jsx holds the splash screen until `success` is true so no screen ever
// reads from a database that hasn't finished migrating.
export function useDbMigrations() {
  return useMigrations(db, migrations);
}
