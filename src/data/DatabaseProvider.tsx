// Baza w telefonie: otwarcie, migracje i gotowe dane, zanim pokażą się ekrany.
import { SQLiteProvider, type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, useMemo } from 'react';

import type { Db } from './db';
import { createExpoDb } from './expoDb';
import { migrate } from './migrations';
import { seedBuiltinData } from './seed/seed';

export const DATABASE_NAME = 'training.db';

async function initialize(database: SQLiteDatabase): Promise<void> {
  // WAL zapisuje się w pliku bazy, więc wystarczy raz; zalecane w dokumentacji expo-sqlite.
  await database.execAsync('PRAGMA journal_mode = WAL;');
  const db = createExpoDb(database);
  const migration = await migrate(db);
  const seed = await seedBuiltinData(db);
  if (__DEV__) {
    console.log(
      `[db] ${DATABASE_NAME}: wersja ${migration.from} → ${migration.to}, gotowe ćwiczenia ${seed.updated ? 'zaktualizowane' : 'bez zmian'}`,
    );
  }
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initialize}>
      {children}
    </SQLiteProvider>
  );
}

/** Dostęp do bazy w komponentach. Zapytania przez repozytoria z `src/data/repositories`. */
export function useDb(): Db {
  const database = useSQLiteContext();
  // Jedna kolejka zapytań na połączenie; połączenie z migracji ma własną, ale kończy się przed ekranami.
  return useMemo(() => createExpoDb(database), [database]);
}
