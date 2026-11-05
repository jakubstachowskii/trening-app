import type { SQLiteDatabase } from 'expo-sqlite';

import { createDb, type Db, type SqlDriver } from './db';

export function createExpoDb(database: SQLiteDatabase): Db {
  const driver: SqlDriver = {
    exec: (sql) => database.execAsync(sql),
    run: async (sql, params) => {
      const { changes } = await database.runAsync(sql, params);
      return { changes };
    },
    all: (sql, params) => database.getAllAsync(sql, params),
    first: (sql, params) => database.getFirstAsync(sql, params),
  };
  return createDb(driver);
}
