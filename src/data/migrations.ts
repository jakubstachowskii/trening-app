// Schemat bazy (docs/PLAN.md §4). Każda migracja to stały SQL; numer wersji w PRAGMA user_version.
// Nowa zmiana schematu = NOWY element na końcu listy. Istniejących migracji nie zmieniamy.
import type { Db } from './db';
import { nowIso } from './ids';

const V1 = `
CREATE TABLE exercise (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('builtin', 'user')),
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'time')),
  primary_muscles TEXT NOT NULL DEFAULT '[]',
  secondary_muscles TEXT NOT NULL DEFAULT '[]',
  equipment TEXT NOT NULL,
  note TEXT,
  is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1)),
  created_at TEXT NOT NULL,
  CHECK (source = 'builtin' OR name IS NOT NULL)
);

CREATE TABLE plan (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  source_program_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX plan_single_active ON plan (is_active) WHERE is_active = 1;

CREATE TABLE plan_day (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plan (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL
);
CREATE INDEX plan_day_plan ON plan_day (plan_id, position);

CREATE TABLE plan_exercise (
  id TEXT PRIMARY KEY,
  plan_day_id TEXT NOT NULL REFERENCES plan_day (id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercise (id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  reps_min INTEGER,
  reps_max INTEGER,
  target_weight_kg REAL,
  target_duration_sec INTEGER,
  rest_sec INTEGER,
  note TEXT,
  CHECK (reps_min IS NULL OR reps_max IS NULL OR reps_min <= reps_max)
);
CREATE INDEX plan_exercise_day ON plan_exercise (plan_day_id, position);

CREATE TABLE workout (
  id TEXT PRIMARY KEY,
  plan_day_id TEXT REFERENCES plan_day (id) ON DELETE SET NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  note TEXT,
  bodyweight_kg REAL
);
CREATE INDEX workout_started ON workout (started_at);

CREATE TABLE workout_exercise (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workout (id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercise (id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX workout_exercise_workout ON workout_exercise (workout_id, position);
CREATE INDEX workout_exercise_exercise ON workout_exercise (exercise_id);

CREATE TABLE workout_set (
  id TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercise (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('warmup', 'working')),
  reps INTEGER CHECK (reps IS NULL OR reps >= 0),
  weight_kg REAL CHECK (weight_kg IS NULL OR weight_kg >= 0),
  duration_sec INTEGER CHECK (duration_sec IS NULL OR duration_sec >= 0),
  rpe REAL,
  completed_at TEXT
);
CREATE INDEX workout_set_exercise ON workout_set (workout_exercise_id, position);

CREATE TABLE bodyweight_entry (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL CHECK (weight_kg > 0)
);

CREATE TABLE setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE schema_migration (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;

export const MIGRATIONS: readonly string[] = [V1];
export const LATEST_VERSION = MIGRATIONS.length;

/** Ustawienia połączenia: przy każdym otwarciu bazy (klucze obce nie są zapisywane w pliku). */
export async function configureConnection(db: Db): Promise<void> {
  await db.exec('PRAGMA foreign_keys = ON;');
}

export async function migrate(db: Db): Promise<{ from: number; to: number }> {
  await configureConnection(db);
  const row = await db.first<{ user_version: number }>('PRAGMA user_version');
  const from = row?.user_version ?? 0;
  if (from > LATEST_VERSION) {
    throw new Error(`Baza ma wersję ${from}, a aplikacja zna tylko ${LATEST_VERSION}.`);
  }

  for (let version = from + 1; version <= LATEST_VERSION; version++) {
    await db.transaction(async (tx) => {
      await tx.exec(MIGRATIONS[version - 1]);
      await tx.run('INSERT INTO schema_migration (version, applied_at) VALUES (?, ?)', [
        version,
        nowIso(),
      ]);
      // PRAGMA nie przyjmuje parametrów; wersja to liczba całkowita z tej funkcji, nie dane z zewnątrz.
      await tx.exec(`PRAGMA user_version = ${Math.trunc(version)}`);
    });
  }
  return { from, to: LATEST_VERSION };
}
