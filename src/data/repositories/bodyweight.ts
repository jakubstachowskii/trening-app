import type { Db } from '../db';
import { newId } from '../ids';
import type { BodyweightEntry } from '../models';

type Row = { id: string; date: string; weight_kg: number };
const toEntry = (row: Row): BodyweightEntry => ({
  id: row.id,
  date: row.date,
  weightKg: row.weight_kg,
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Jeden wpis na dzień (data lokalna RRRR-MM-DD); ponowny wpis tego dnia nadpisuje poprzedni. */
export async function saveBodyweight(db: Db, date: string, weightKg: number): Promise<void> {
  if (!DATE.test(date)) throw new Error('Data musi mieć format RRRR-MM-DD.');
  if (!(weightKg > 0)) throw new Error('Masa ciała musi być większa od zera.');
  await db.run(
    `INSERT INTO bodyweight_entry (id, date, weight_kg) VALUES (?, ?, ?)
     ON CONFLICT (date) DO UPDATE SET weight_kg = excluded.weight_kg`,
    [newId(), date, weightKg],
  );
}

export async function listBodyweight(db: Db): Promise<BodyweightEntry[]> {
  const rows = await db.all<Row>('SELECT id, date, weight_kg FROM bodyweight_entry ORDER BY date');
  return rows.map(toEntry);
}

export async function latestBodyweight(db: Db): Promise<BodyweightEntry | null> {
  const row = await db.first<Row>(
    'SELECT id, date, weight_kg FROM bodyweight_entry ORDER BY date DESC LIMIT 1',
  );
  return row ? toEntry(row) : null;
}

export async function deleteBodyweight(db: Db, id: string): Promise<void> {
  await db.run('DELETE FROM bodyweight_entry WHERE id = ?', [id]);
}
