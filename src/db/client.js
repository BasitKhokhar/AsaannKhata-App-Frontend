import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// One connection for the whole app's lifetime — expo-sqlite is JSI-based and
// synchronous-capable, safe to share across the repository layer.
export const expoDb = openDatabaseSync('asaankhata.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });
