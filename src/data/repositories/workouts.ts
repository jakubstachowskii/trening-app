import type { HistorySet } from '@/domain/records';
import type { SetKind } from '@/domain/types';

import type { Db } from '../db';
import { newId, nowIso } from '../ids';
import type { Workout, WorkoutExercise, WorkoutSet, WorkoutWithExercises } from '../models';

type WorkoutRow = {
  id: string;
  plan_day_id: string | null;
  started_at: string;
  finished_at: string | null;
  note: string | null;
  bodyweight_kg: number | null;
};
type ExerciseRow = { id: string; exercise_id: string; position: number; note: string | null };
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

const WORKOUT_COLUMNS = 'id, plan_day_id, started_at, finished_at, note, bodyweight_kg';

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    planDayId: row.plan_day_id,
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
  input: { planDayId?: string | null; bodyweightKg?: number | null; startedAt?: string } = {},
): Promise<string> {
  const id = newId();
  await db.run(
    'INSERT INTO workout (id, plan_day_id, started_at, bodyweight_kg) VALUES (?, ?, ?, ?)',
    [id, input.planDayId ?? null, input.startedAt ?? nowIso(), input.bodyweightKg ?? null],
  );
  return id;
}

export async function addWorkoutExercise(
  db: Db,
  workoutId: string,
  exerciseId: string,
): Promise<string> {
  const id = newId();
  await db.run(
    `INSERT INTO workout_exercise (id, workout_id, exercise_id, position)
     VALUES (?, ?, ?, (SELECT COUNT(*) FROM workout_exercise WHERE workout_id = ?))`,
    [id, workoutId, exerciseId, workoutId],
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
     VALUES (?, ?, (SELECT COUNT(*) FROM workout_set WHERE workout_exercise_id = ?), ?, ?, ?, ?, ?)`,
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
  await db.run('DELETE FROM workout_set WHERE id = ?', [setId]);
}

export async function finishWorkout(
  db: Db,
  workoutId: string,
  finishedAt: string = nowIso(),
): Promise<void> {
  await db.run('UPDATE workout SET finished_at = ? WHERE id = ?', [finishedAt, workoutId]);
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
    'SELECT id, exercise_id, position, note FROM workout_exercise WHERE workout_id = ? ORDER BY position',
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
