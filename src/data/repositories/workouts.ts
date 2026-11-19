import type { HistorySet } from '@/domain/records';
import type { SetKind } from '@/domain/types';
import { DEFAULT_SET_COUNT, prefillSets, type PrefillTarget } from '@/domain/workout';

import type { Db } from '../db';
import { newId, nowIso } from '../ids';
import type { Workout, WorkoutExercise, WorkoutSet, WorkoutWithExercises } from '../models';
import { getExercise } from './exercises';
import { getPlanDay } from './plans';

type WorkoutRow = {
  id: string;
  plan_day_id: string | null;
  name: string | null;
  started_at: string;
  finished_at: string | null;
  note: string | null;
  bodyweight_kg: number | null;
};
type ExerciseRow = {
  id: string;
  exercise_id: string;
  position: number;
  note: string | null;
  rest_sec: number | null;
  reps_min: number | null;
  reps_max: number | null;
  target_duration_sec: number | null;
};
type SetRow = {
  id: string;
  workout_exercise_id: string;
  position: number;
  kind: SetKind;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  rpe: number | null;
  completed_at: string | null;
};

const WORKOUT_COLUMNS = 'id, plan_day_id, name, started_at, finished_at, note, bodyweight_kg';

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    planDayId: row.plan_day_id,
    name: row.name,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    note: row.note,
    bodyweightKg: row.bodyweight_kg,
  };
}

function toSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    kind: row.kind,
    reps: row.reps,
    weightKg: row.weight_kg,
    durationSec: row.duration_sec,
    rpe: row.rpe,
    completedAt: row.completed_at,
  };
}

export async function startWorkout(
  db: Db,
  input: {
    planDayId?: string | null;
    name?: string | null;
    bodyweightKg?: number | null;
    startedAt?: string;
  } = {},
): Promise<string> {
  const id = newId();
  await db.run(
    'INSERT INTO workout (id, plan_day_id, name, started_at, bodyweight_kg) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      input.planDayId ?? null,
      input.name ?? null,
      input.startedAt ?? nowIso(),
      input.bodyweightKg ?? null,
    ],
  );
  return id;
}

export type WorkoutExerciseTarget = {
  restSec?: number | null;
  repsMin?: number | null;
  repsMax?: number | null;
  targetDurationSec?: number | null;
};

export async function addWorkoutExercise(
  db: Db,
  workoutId: string,
  exerciseId: string,
  target: WorkoutExerciseTarget = {},
): Promise<string> {
  const id = newId();
  await db.run(
    `INSERT INTO workout_exercise
       (id, workout_id, exercise_id, position, rest_sec, reps_min, reps_max, target_duration_sec)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(position) + 1, 0) FROM workout_exercise WHERE workout_id = ?),
       ?, ?, ?, ?)`,
    [
      id,
      workoutId,
      exerciseId,
      workoutId,
      target.restSec ?? null,
      target.repsMin ?? null,
      target.repsMax ?? null,
      target.targetDurationSec ?? null,
    ],
  );
  return id;
}

export type SetInput = {
  kind?: SetKind;
  reps?: number | null;
  weightKg?: number | null;
  durationSec?: number | null;
  completedAt?: string | null;
};

export async function addSet(db: Db, workoutExerciseId: string, input: SetInput): Promise<string> {
  const id = newId();
  await db.run(
    `INSERT INTO workout_set (id, workout_exercise_id, position, kind, reps, weight_kg, duration_sec, completed_at)
     VALUES (?, ?, (SELECT COALESCE(MAX(position) + 1, 0) FROM workout_set WHERE workout_exercise_id = ?),
       ?, ?, ?, ?, ?)`,
    [
      id,
      workoutExerciseId,
      workoutExerciseId,
      input.kind ?? 'working',
      input.reps ?? null,
      input.weightKg ?? null,
      input.durationSec ?? null,
      input.completedAt ?? null,
    ],
  );
  return id;
}

/** Zapis na bieżąco: każda zmiana serii od razu w bazie (trening przetrwa zamknięcie aplikacji). */
export async function updateSet(db: Db, setId: string, input: SetInput): Promise<void> {
  await db.run(
    `UPDATE workout_set SET kind = COALESCE(?, kind), reps = ?, weight_kg = ?, duration_sec = ?, completed_at = ?
     WHERE id = ?`,
    [
      input.kind ?? null,
      input.reps ?? null,
      input.weightKg ?? null,
      input.durationSec ?? null,
      input.completedAt ?? null,
      setId,
    ],
  );
}

export async function deleteSet(db: Db, setId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const row = await tx.first<{ workout_exercise_id: string }>(
      'SELECT workout_exercise_id FROM workout_set WHERE id = ?',
      [setId],
    );
    await tx.run('DELETE FROM workout_set WHERE id = ?', [setId]);
    if (row) await renumberSets(tx, row.workout_exercise_id);
  });
}

async function renumberSets(tx: Db, workoutExerciseId: string): Promise<void> {
  const rows = await tx.all<{ id: string }>(
    'SELECT id FROM workout_set WHERE workout_exercise_id = ? ORDER BY position',
    [workoutExerciseId],
  );
  for (const [index, row] of rows.entries()) {
    await tx.run('UPDATE workout_set SET position = ? WHERE id = ?', [index, row.id]);
  }
}

async function renumberExercises(tx: Db, workoutId: string): Promise<void> {
  const rows = await tx.all<{ id: string }>(
    'SELECT id FROM workout_exercise WHERE workout_id = ? ORDER BY position',
    [workoutId],
  );
  for (const [index, row] of rows.entries()) {
    await tx.run('UPDATE workout_exercise SET position = ? WHERE id = ?', [index, row.id]);
  }
}

/** Serie wypełnione z ostatniego treningu, podpowiedzi ciężaru i celu planu. */
async function insertPrefilledSets(
  tx: Db,
  workoutExerciseId: string,
  exerciseId: string,
  target: PrefillTarget,
  stepKg?: number,
): Promise<void> {
  const exercise = await getExercise(tx, exerciseId);
  if (!exercise) throw new Error('Nie ma takiego ćwiczenia.');
  const lastSets = await lastSetsForExercise(tx, exerciseId);
  const sets = prefillSets({ type: exercise.type, target, lastSets, stepKg });
  for (const set of sets) await addSet(tx, workoutExerciseId, set);
}

/** Trening z dnia planu: ćwiczenia, cele i serie gotowe do odhaczania (jedna transakcja). */
export async function startWorkoutFromDay(
  db: Db,
  dayId: string,
  options: { bodyweightKg?: number | null; startedAt?: string; stepKg?: number } = {},
): Promise<string> {
  return db.transaction(async (tx) => {
    const day = await getPlanDay(tx, dayId);
    if (!day) throw new Error('Nie ma takiego dnia planu.');
    const workoutId = await startWorkout(tx, {
      planDayId: day.id,
      name: day.name,
      bodyweightKg: options.bodyweightKg,
      startedAt: options.startedAt,
    });
    for (const pe of day.exercises) {
      const weId = await addWorkoutExercise(tx, workoutId, pe.exerciseId, pe);
      await insertPrefilledSets(tx, weId, pe.exerciseId, pe, options.stepKg);
    }
    return workoutId;
  });
}

export function startEmptyWorkout(
  db: Db,
  options: { bodyweightKg?: number | null; startedAt?: string } = {},
): Promise<string> {
  return startWorkout(db, options);
}

/** Ćwiczenie dodane w trakcie: serie jak ostatnio (albo 3 puste). */
export async function addExerciseToWorkout(
  db: Db,
  workoutId: string,
  exerciseId: string,
  options: { stepKg?: number } = {},
): Promise<string> {
  return db.transaction(async (tx) => {
    const id = await addWorkoutExercise(tx, workoutId, exerciseId);
    await insertPrefilledSets(tx, id, exerciseId, {}, options.stepKg);
    return id;
  });
}

/** Zamiana ćwiczenia: ta sama liczba serii, wartości od nowa z historii nowego ćwiczenia. */
export async function replaceWorkoutExercise(
  db: Db,
  workoutExerciseId: string,
  exerciseId: string,
  options: { stepKg?: number } = {},
): Promise<void> {
  await db.transaction(async (tx) => {
    const row = await tx.first<ExerciseRow & { set_count: number }>(
      `SELECT e.*, (SELECT COUNT(*) FROM workout_set s WHERE s.workout_exercise_id = e.id) AS set_count
       FROM workout_exercise e WHERE e.id = ?`,
      [workoutExerciseId],
    );
    if (!row) throw new Error('Nie ma takiego ćwiczenia w treningu.');
    await tx.run('DELETE FROM workout_set WHERE workout_exercise_id = ?', [workoutExerciseId]);
    await tx.run('UPDATE workout_exercise SET exercise_id = ? WHERE id = ?', [
      exerciseId,
      workoutExerciseId,
    ]);
    await insertPrefilledSets(
      tx,
      workoutExerciseId,
      exerciseId,
      {
        targetSets: Number(row.set_count) || DEFAULT_SET_COUNT,
        repsMin: row.reps_min,
        repsMax: row.reps_max,
        targetDurationSec: row.target_duration_sec,
      },
      options.stepKg,
    );
  });
}

export async function deleteWorkoutExercise(db: Db, workoutExerciseId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const row = await tx.first<{ workout_id: string }>(
      'SELECT workout_id FROM workout_exercise WHERE id = ?',
      [workoutExerciseId],
    );
    await tx.run('DELETE FROM workout_exercise WHERE id = ?', [workoutExerciseId]);
    if (row) await renumberExercises(tx, row.workout_id);
  });
}

const cleanNote = (note: string | null | undefined): string | null => note?.trim() || null;

export async function setWorkoutExerciseNote(
  db: Db,
  workoutExerciseId: string,
  note: string | null,
): Promise<void> {
  await db.run('UPDATE workout_exercise SET note = ? WHERE id = ?', [
    cleanNote(note),
    workoutExerciseId,
  ]);
}

export async function setWorkoutNote(
  db: Db,
  workoutId: string,
  note: string | null,
): Promise<void> {
  await db.run('UPDATE workout SET note = ? WHERE id = ?', [cleanNote(note), workoutId]);
}

export async function finishWorkout(
  db: Db,
  workoutId: string,
  finishedAt: string = nowIso(),
): Promise<void> {
  await db.run('UPDATE workout SET finished_at = ? WHERE id = ?', [finishedAt, workoutId]);
}

/**
 * Zakończenie z porządkiem: nieodhaczone serie i ćwiczenia bez serii znikają.
 * Trening bez żadnej odhaczonej serii jest porzucany (nie trafia do historii).
 */
export async function completeWorkout(
  db: Db,
  workoutId: string,
  finishedAt: string = nowIso(),
): Promise<'finished' | 'discarded'> {
  return db.transaction(async (tx) => {
    await tx.run(
      `DELETE FROM workout_set WHERE completed_at IS NULL AND workout_exercise_id IN
         (SELECT id FROM workout_exercise WHERE workout_id = ?)`,
      [workoutId],
    );
    await tx.run(
      `DELETE FROM workout_exercise WHERE workout_id = ? AND NOT EXISTS
         (SELECT 1 FROM workout_set s WHERE s.workout_exercise_id = workout_exercise.id)`,
      [workoutId],
    );
    const left = await tx.first<{ n: number }>(
      'SELECT COUNT(*) AS n FROM workout_exercise WHERE workout_id = ?',
      [workoutId],
    );
    if (!left || Number(left.n) === 0) {
      await tx.run('DELETE FROM workout WHERE id = ?', [workoutId]);
      return 'discarded';
    }
    const exercises = await tx.all<{ id: string }>(
      'SELECT id FROM workout_exercise WHERE workout_id = ?',
      [workoutId],
    );
    for (const e of exercises) await renumberSets(tx, e.id);
    await renumberExercises(tx, workoutId);
    await tx.run('UPDATE workout SET finished_at = ? WHERE id = ?', [finishedAt, workoutId]);
    return 'finished';
  });
}

export async function deleteWorkout(db: Db, workoutId: string): Promise<void> {
  await db.run('DELETE FROM workout WHERE id = ?', [workoutId]);
}

/** Niezakończony trening (np. po zamknięciu aplikacji w trakcie). */
export async function getUnfinishedWorkout(db: Db): Promise<Workout | null> {
  const row = await db.first<WorkoutRow>(
    `SELECT ${WORKOUT_COLUMNS} FROM workout WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? toWorkout(row) : null;
}

export async function getWorkout(db: Db, id: string): Promise<WorkoutWithExercises | null> {
  const row = await db.first<WorkoutRow>(`SELECT ${WORKOUT_COLUMNS} FROM workout WHERE id = ?`, [
    id,
  ]);
  if (!row) return null;
  const exercises = await db.all<ExerciseRow>(
    `SELECT id, exercise_id, position, note, rest_sec, reps_min, reps_max, target_duration_sec
     FROM workout_exercise WHERE workout_id = ? ORDER BY position`,
    [id],
  );
  const sets = await db.all<SetRow>(
    `SELECT s.* FROM workout_set s JOIN workout_exercise e ON e.id = s.workout_exercise_id
     WHERE e.workout_id = ? ORDER BY s.position`,
    [id],
  );
  return {
    ...toWorkout(row),
    exercises: exercises.map<WorkoutExercise>((e) => ({
      id: e.id,
      exerciseId: e.exercise_id,
      position: e.position,
      note: e.note,
      restSec: e.rest_sec,
      repsMin: e.reps_min,
      repsMax: e.reps_max,
      targetDurationSec: e.target_duration_sec,
      sets: sets.filter((s) => s.workout_exercise_id === e.id).map(toSet),
    })),
  };
}

/** Zakończone treningi od najnowszych, stronami. */
export async function listWorkouts(db: Db, { limit = 50, offset = 0 } = {}): Promise<Workout[]> {
  const rows = await db.all<WorkoutRow>(
    `SELECT ${WORKOUT_COLUMNS} FROM workout WHERE finished_at IS NOT NULL
     ORDER BY started_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map(toWorkout);
}

/** Dzień planu z ostatniego zakończonego treningu tego planu (do „Następny trening”). */
export async function lastFinishedDayForPlan(db: Db, planId: string): Promise<string | null> {
  const row = await db.first<{ plan_day_id: string }>(
    `SELECT w.plan_day_id FROM workout w JOIN plan_day d ON d.id = w.plan_day_id
     WHERE d.plan_id = ? AND w.finished_at IS NOT NULL
     ORDER BY w.started_at DESC LIMIT 1`,
    [planId],
  );
  return row?.plan_day_id ?? null;
}

/** Data pierwszego zakończonego treningu z danego planu (licznik „tydzień N” na karcie Plan). */
export async function firstFinishedForPlan(db: Db, planId: string): Promise<string | null> {
  const row = await db.first<{ started_at: string }>(
    `SELECT w.started_at FROM workout w JOIN plan_day d ON d.id = w.plan_day_id
     WHERE d.plan_id = ? AND w.finished_at IS NOT NULL
     ORDER BY w.started_at LIMIT 1`,
    [planId],
  );
  return row?.started_at ?? null;
}

/** Wszystkie serie ćwiczenia z zakończonych treningów — wejście dla rekordów i wykresów. */
export async function exerciseHistory(db: Db, exerciseId: string): Promise<HistorySet[]> {
  const rows = await db.all<
    SetRow & { workout_id: string; started_at: string; bodyweight_kg: number | null }
  >(
    `SELECT s.*, w.id AS workout_id, w.started_at, w.bodyweight_kg
     FROM workout_set s
     JOIN workout_exercise e ON e.id = s.workout_exercise_id
     JOIN workout w ON w.id = e.workout_id
     WHERE e.exercise_id = ? AND w.finished_at IS NOT NULL
     ORDER BY w.started_at, e.position, s.position`,
    [exerciseId],
  );
  return rows.map((r) => ({
    ...toSet(r),
    workoutId: r.workout_id,
    date: r.started_at,
    bodyweightKg: r.bodyweight_kg,
  }));
}

/** Serie ćwiczenia z ostatniego zakończonego treningu (do podpowiedzi ciężaru). */
export async function lastSetsForExercise(db: Db, exerciseId: string): Promise<WorkoutSet[]> {
  const last = await db.first<{ id: string }>(
    `SELECT w.id FROM workout w JOIN workout_exercise e ON e.workout_id = w.id
     WHERE e.exercise_id = ? AND w.finished_at IS NOT NULL
     ORDER BY w.started_at DESC LIMIT 1`,
    [exerciseId],
  );
  if (!last) return [];
  const rows = await db.all<SetRow>(
    `SELECT s.* FROM workout_set s JOIN workout_exercise e ON e.id = s.workout_exercise_id
     WHERE e.workout_id = ? AND e.exercise_id = ? ORDER BY e.position, s.position`,
    [last.id, exerciseId],
  );
  return rows.map(toSet);
}

/** Daty rozpoczęcia wszystkich zakończonych treningów (tydzień, seria tygodni na ekranie „Dziś”). */
export async function listFinishedStarts(db: Db): Promise<string[]> {
  const rows = await db.all<{ started_at: string }>(
    'SELECT started_at FROM workout WHERE finished_at IS NOT NULL ORDER BY started_at',
  );
  return rows.map((r) => r.started_at);
}

/**
 * Zakończone treningi rozpoczęte w [from, to), od najstarszego (tydzień planu, kalendarz historii).
 * Daty jako ISO, porównywane tekstowo jak `started_at`.
 */
export async function listFinishedBetween(
  db: Db,
  fromIso: string,
  toIso: string,
): Promise<Workout[]> {
  const rows = await db.all<WorkoutRow>(
    `SELECT ${WORKOUT_COLUMNS} FROM workout
     WHERE finished_at IS NOT NULL AND started_at >= ? AND started_at < ?
     ORDER BY started_at`,
    [fromIso, toIso],
  );
  return rows.map(toWorkout);
}

/** Poprzedni zakończony trening tego samego dnia planu (porównanie w podsumowaniu). */
export async function previousFinishedForDay(
  db: Db,
  planDayId: string,
  beforeStartedAt: string,
): Promise<Workout | null> {
  const row = await db.first<WorkoutRow>(
    `SELECT ${WORKOUT_COLUMNS} FROM workout
     WHERE plan_day_id = ? AND finished_at IS NOT NULL AND started_at < ?
     ORDER BY started_at DESC LIMIT 1`,
    [planDayId, beforeStartedAt],
  );
  return row ? toWorkout(row) : null;
}
