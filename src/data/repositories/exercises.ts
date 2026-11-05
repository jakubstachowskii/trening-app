import type { ExerciseType } from '@/domain/types';

import { type Db, fromFlag, toFlag } from '../db';
import { newId, nowIso } from '../ids';
import type { Equipment, Exercise, Muscle } from '../models';

type Row = {
  id: string;
  source: Exercise['source'];
  name: string | null;
  type: ExerciseType;
  primary_muscles: string;
  secondary_muscles: string;
  equipment: Equipment;
  note: string | null;
  is_hidden: number;
};

const COLUMNS =
  'id, source, name, type, primary_muscles, secondary_muscles, equipment, note, is_hidden';

function toExercise(row: Row): Exercise {
  return {
    id: row.id,
    source: row.source,
    name: row.name,
    type: row.type,
    primaryMuscles: JSON.parse(row.primary_muscles) as Muscle[],
    secondaryMuscles: JSON.parse(row.secondary_muscles) as Muscle[],
    equipment: row.equipment,
    note: row.note,
    isHidden: fromFlag(row.is_hidden),
  };
}

export async function listExercises(
  db: Db,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<Exercise[]> {
  const rows = await db.all<Row>(
    `SELECT ${COLUMNS} FROM exercise ${includeHidden ? '' : 'WHERE is_hidden = 0'} ORDER BY id`,
  );
  return rows.map(toExercise);
}

export async function getExercise(db: Db, id: string): Promise<Exercise | null> {
  const row = await db.first<Row>(`SELECT ${COLUMNS} FROM exercise WHERE id = ?`, [id]);
  return row ? toExercise(row) : null;
}

export type CustomExerciseInput = {
  name: string;
  type: ExerciseType;
  primaryMuscles: Muscle[];
  secondaryMuscles?: Muscle[];
  equipment: Equipment;
  note?: string | null;
};

export async function createCustomExercise(db: Db, input: CustomExerciseInput): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error('Nazwa ćwiczenia nie może być pusta.');
  const id = newId();
  await db.run(
    `INSERT INTO exercise (id, source, name, type, primary_muscles, secondary_muscles, equipment, note, created_at)
     VALUES (?, 'user', ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      input.type,
      JSON.stringify(input.primaryMuscles),
      JSON.stringify(input.secondaryMuscles ?? []),
      input.equipment,
      input.note ?? null,
      nowIso(),
    ],
  );
  return id;
}

/** Edycja tylko własnych ćwiczeń; gotowe zmienia wyłącznie aktualizacja aplikacji. */
export async function updateCustomExercise(
  db: Db,
  id: string,
  input: CustomExerciseInput,
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Nazwa ćwiczenia nie może być pusta.');
  const { changes } = await db.run(
    `UPDATE exercise SET name = ?, type = ?, primary_muscles = ?, secondary_muscles = ?, equipment = ?, note = ?
     WHERE id = ? AND source = 'user'`,
    [
      name,
      input.type,
      JSON.stringify(input.primaryMuscles),
      JSON.stringify(input.secondaryMuscles ?? []),
      input.equipment,
      input.note ?? null,
      id,
    ],
  );
  if (changes === 0) throw new Error('Można edytować tylko własne ćwiczenia.');
}

/** Ukrycie zamiast usunięcia: ćwiczenie może być w historii treningów. Działa też dla gotowych. */
export async function setExerciseHidden(db: Db, id: string, hidden: boolean): Promise<void> {
  await db.run('UPDATE exercise SET is_hidden = ? WHERE id = ?', [toFlag(hidden), id]);
}
