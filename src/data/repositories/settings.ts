import type { Db } from '../db';

/** Ustawienia jako JSON pod kluczem. Nieznany albo uszkodzony wpis = wartość domyślna. */
export async function getSetting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const row = await db.first<{ value: string }>('SELECT value FROM setting WHERE key = ?', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(db: Db, key: string, value: unknown): Promise<void> {
  await db.run(
    `INSERT INTO setting (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [key, JSON.stringify(value)],
  );
}
