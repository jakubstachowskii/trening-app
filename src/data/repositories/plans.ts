import { type Db, fromFlag, toFlag } from '../db';
import { newId, nowIso } from '../ids';
import type { Level, Plan, PlanDay, PlanExercise, PlanWithDays } from '../models';
import type { BuiltinProgram } from '../seed/programs';

type PlanRow = {
  id: string;
  name: string;
  description: string | null;
  level: Level | null;
  source_program_id: string | null;
  is_active: number;
  weekdays: string | null;
  created_at: string;
};
type DayRow = { id: string; name: string; position: number };
type ExerciseRow = {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  reps_min: number | null;
  reps_max: number | null;
  target_weight_kg: number | null;
  target_duration_sec: number | null;
  rest_sec: number | null;
  note: string | null;
};

const PLAN_COLUMNS =
  'id, name, description, level, source_program_id, is_active, weekdays, created_at';

/** "0,2,4" → [0, 2, 4]; puste albo uszkodzone = null. */
export function parseWeekdays(text: string | null): number[] | null {
  if (!text) return null;
  const days = [...new Set(text.split(',').map(Number))]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  return days.length ? days : null;
}

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    level: row.level,
    sourceProgramId: row.source_program_id,
    isActive: fromFlag(row.is_active),
    weekdays: parseWeekdays(row.weekdays),
    createdAt: row.created_at,
  };
}

function toPlanExercise(row: ExerciseRow): PlanExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    position: row.position,
    targetSets: row.target_sets,
    repsMin: row.reps_min,
    repsMax: row.reps_max,
    targetWeightKg: row.target_weight_kg,
    targetDurationSec: row.target_duration_sec,
    restSec: row.rest_sec,
    note: row.note,
  };
}

/** Aktywny plan na górze, potem od najnowszych (docs/PLAN.md §3.3). */
export async function listPlans(db: Db): Promise<Plan[]> {
  const rows = await db.all<PlanRow>(
    `SELECT ${PLAN_COLUMNS} FROM plan ORDER BY is_active DESC, created_at DESC`,
  );
  return rows.map(toPlan);
}

export async function getPlan(db: Db, id: string): Promise<PlanWithDays | null> {
  const plan = await db.first<PlanRow>(`SELECT ${PLAN_COLUMNS} FROM plan WHERE id = ?`, [id]);
  if (!plan) return null;
  const days = await db.all<DayRow>(
    'SELECT id, name, position FROM plan_day WHERE plan_id = ? ORDER BY position',
    [id],
  );
  const exercises = await db.all<ExerciseRow>(
    `SELECT e.* FROM plan_exercise e JOIN plan_day d ON d.id = e.plan_day_id
     WHERE d.plan_id = ? ORDER BY e.position`,
    [id],
  );
  const byDay = (dayId: string) =>
    exercises.filter((e) => e.plan_day_id === dayId).map(toPlanExercise);
  return { ...toPlan(plan), days: days.map<PlanDay>((d) => ({ ...d, exercises: byDay(d.id) })) };
}

export type PlanInput = { name: string; description?: string | null; level?: Level | null };

export async function createPlan(db: Db, input: PlanInput): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error('Nazwa planu nie może być pusta.');
  const id = newId();
  await db.run(
    'INSERT INTO plan (id, name, description, level, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, input.description ?? null, input.level ?? null, nowIso()],
  );
  return id;
}

export async function addPlanDay(db: Db, planId: string, name: string): Promise<string> {
  const id = newId();
  await db.run(
    `INSERT INTO plan_day (id, plan_id, name, position)
     VALUES (?, ?, ?, (SELECT COUNT(*) FROM plan_day WHERE plan_id = ?))`,
    [id, planId, name.trim(), planId],
  );
  return id;
}

export type PlanExerciseInput = Omit<PlanExercise, 'id' | 'position'>;

export async function addPlanExercise(
  db: Db,
  planDayId: string,
  input: PlanExerciseInput,
): Promise<string> {
  const id = newId();
  await db.run(
    `INSERT INTO plan_exercise (id, plan_day_id, exercise_id, position, target_sets, reps_min, reps_max,
       target_weight_kg, target_duration_sec, rest_sec, note)
     VALUES (?, ?, ?, (SELECT COUNT(*) FROM plan_exercise WHERE plan_day_id = ?), ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      planDayId,
      input.exerciseId,
      planDayId,
      input.targetSets,
      input.repsMin,
      input.repsMax,
      input.targetWeightKg,
      input.targetDurationSec,
      input.restSec,
      input.note,
    ],
  );
  return id;
}

/** Tylko jeden plan aktywny naraz (pilnuje też unikalny indeks w bazie). */
export async function setActivePlan(db: Db, planId: string | null): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.run('UPDATE plan SET is_active = 0 WHERE is_active = 1');
    if (planId) await tx.run('UPDATE plan SET is_active = ? WHERE id = ?', [toFlag(true), planId]);
  });
}

/** Usuwa plan z dniami i ćwiczeniami; treningi z historii zostają (bez powiązania z dniem). */
export async function deletePlan(db: Db, planId: string): Promise<void> {
  await db.run('DELETE FROM plan WHERE id = ?', [planId]);
}

/**
 * Nazwa, której nie ma jeszcze na liście: „Całe ciało, 3 dni” → „Całe ciało, 3 dni (2)” → „(3)”…
 * Dzięki temu dwie kopie tego samego programu da się odróżnić.
 */
export function uniquePlanName(base: string, taken: readonly string[]): string {
  const names = new Set(taken);
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} (${n})`)) n += 1;
  return `${base} (${n})`;
}

/**
 * Gotowy program → kopia w „moich planach”, którą można dowolnie zmieniać.
 * `translate` zamienia klucze tłumaczeń na tekst w momencie kopiowania.
 */
export async function copyProgram(
  db: Db,
  program: BuiltinProgram,
  translate: (key: string) => string,
): Promise<string> {
  return db.transaction(async (tx) => {
    const planId = newId();
    const taken = await tx.all<{ name: string }>('SELECT name FROM plan');
    const name = uniquePlanName(
      translate(`programs.${program.id}.name`),
      taken.map((row) => row.name),
    );
    await tx.run(
      `INSERT INTO plan (id, name, description, level, source_program_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        planId,
        name,
        translate(`programs.${program.id}.description`),
        program.level,
        program.id,
        nowIso(),
      ],
    );
    for (const [dayIndex, day] of program.days.entries()) {
      const dayId = newId();
      await tx.run('INSERT INTO plan_day (id, plan_id, name, position) VALUES (?, ?, ?, ?)', [
        dayId,
        planId,
        translate(`programs.${program.id}.days.${day.key}`),
        dayIndex,
      ]);
      for (const [position, item] of day.exercises.entries()) {
        await tx.run(
          `INSERT INTO plan_exercise (id, plan_day_id, exercise_id, position, target_sets, reps_min, reps_max,
             target_duration_sec, rest_sec)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId(),
            dayId,
            item.exerciseId,
            position,
            item.sets,
            item.repsMin ?? null,
            item.repsMax ?? null,
            item.durationSec ?? null,
            item.restSec,
          ],
        );
      }
    }
    return planId;
  });
}

export async function updatePlan(db: Db, planId: string, input: PlanInput): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Nazwa planu nie może być pusta.');
  await db.run('UPDATE plan SET name = ?, description = ?, level = ? WHERE id = ?', [
    name,
    input.description?.trim() || null,
    input.level ?? null,
    planId,
  ]);
}

export type PlanSummary = Plan & { dayCount: number; exerciseCount: number };

/** Lista planów z liczbą dni i ćwiczeń, w tej samej kolejności co `listPlans`. */
export async function listPlanSummaries(db: Db): Promise<PlanSummary[]> {
  const rows = await db.all<PlanRow & { day_count: number; exercise_count: number }>(
    `SELECT p.id, p.name, p.description, p.level, p.source_program_id, p.is_active, p.created_at,
       (SELECT COUNT(*) FROM plan_day d WHERE d.plan_id = p.id) AS day_count,
       (SELECT COUNT(*) FROM plan_exercise e JOIN plan_day d ON d.id = e.plan_day_id
          WHERE d.plan_id = p.id) AS exercise_count
     FROM plan p ORDER BY p.is_active DESC, p.created_at DESC`,
  );
  return rows.map((row) => ({
    ...toPlan(row),
    dayCount: Number(row.day_count),
    exerciseCount: Number(row.exercise_count),
  }));
}

export async function getPlanDay(
  db: Db,
  dayId: string,
): Promise<(PlanDay & { planId: string }) | null> {
  const day = await db.first<DayRow & { plan_id: string }>(
    'SELECT id, plan_id, name, position FROM plan_day WHERE id = ?',
    [dayId],
  );
  if (!day) return null;
  const exercises = await db.all<ExerciseRow>(
    'SELECT * FROM plan_exercise WHERE plan_day_id = ? ORDER BY position',
    [dayId],
  );
  return {
    id: day.id,
    planId: day.plan_id,
    name: day.name,
    position: day.position,
    exercises: exercises.map(toPlanExercise),
  };
}

export async function renamePlanDay(db: Db, dayId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nazwa dnia nie może być pusta.');
  await db.run('UPDATE plan_day SET name = ? WHERE id = ?', [trimmed, dayId]);
}

/** Usuwa dzień z ćwiczeniami i domyka numerację pozostałych dni. */
export async function deletePlanDay(db: Db, dayId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const day = await tx.first<{ plan_id: string; position: number }>(
      'SELECT plan_id, position FROM plan_day WHERE id = ?',
      [dayId],
    );
    if (!day) return;
    await tx.run('DELETE FROM plan_day WHERE id = ?', [dayId]);
    await tx.run('UPDATE plan_day SET position = position - 1 WHERE plan_id = ? AND position > ?', [
      day.plan_id,
      day.position,
    ]);
  });
}

/**
 * Ustawia kolejność według listy id. Lista musi zawierać dokładnie elementy rodzica,
 * inaczej nic się nie zmienia (chroni przed nieaktualnym widokiem).
 */
const REORDER_SQL = {
  days: {
    list: 'SELECT id FROM plan_day WHERE plan_id = ?',
    move: 'UPDATE plan_day SET position = ? WHERE id = ?',
  },
  exercises: {
    list: 'SELECT id FROM plan_exercise WHERE plan_day_id = ?',
    move: 'UPDATE plan_exercise SET position = ? WHERE id = ?',
  },
} as const;

async function reorder(
  db: Db,
  sql: (typeof REORDER_SQL)[keyof typeof REORDER_SQL],
  parentId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await tx.all<{ id: string }>(sql.list, [parentId]);
    const known = new Set(current.map((row) => row.id));
    const unique = new Set(orderedIds);
    if (unique.size !== orderedIds.length || unique.size !== known.size) {
      throw new Error('Lista do zmiany kolejności jest nieaktualna.');
    }
    for (const id of orderedIds) {
      if (!known.has(id)) throw new Error('Lista do zmiany kolejności jest nieaktualna.');
    }
    for (const [position, id] of orderedIds.entries()) {
      await tx.run(sql.move, [position, id]);
    }
  });
}

export function reorderPlanDays(db: Db, planId: string, orderedIds: string[]): Promise<void> {
  return reorder(db, REORDER_SQL.days, planId, orderedIds);
}

export function reorderPlanExercises(db: Db, dayId: string, orderedIds: string[]): Promise<void> {
  return reorder(db, REORDER_SQL.exercises, dayId, orderedIds);
}

export async function getPlanExercise(db: Db, id: string): Promise<PlanExercise | null> {
  const row = await db.first<ExerciseRow>('SELECT * FROM plan_exercise WHERE id = ?', [id]);
  return row ? toPlanExercise(row) : null;
}

export async function updatePlanExercise(
  db: Db,
  id: string,
  input: Omit<PlanExerciseInput, 'exerciseId'>,
): Promise<void> {
  await db.run(
    `UPDATE plan_exercise SET target_sets = ?, reps_min = ?, reps_max = ?, target_weight_kg = ?,
       target_duration_sec = ?, rest_sec = ?, note = ? WHERE id = ?`,
    [
      input.targetSets,
      input.repsMin,
      input.repsMax,
      input.targetWeightKg,
      input.targetDurationSec,
      input.restSec,
      input.note?.trim() || null,
      id,
    ],
  );
}

/** Usuwa ćwiczenie z dnia i domyka numerację pozostałych. */
export async function deletePlanExercise(db: Db, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const row = await tx.first<{ plan_day_id: string; position: number }>(
      'SELECT plan_day_id, position FROM plan_exercise WHERE id = ?',
      [id],
    );
    if (!row) return;
    await tx.run('DELETE FROM plan_exercise WHERE id = ?', [id]);
    await tx.run(
      'UPDATE plan_exercise SET position = position - 1 WHERE plan_day_id = ? AND position > ?',
      [row.plan_day_id, row.position],
    );
  });
}

/** Dni treningowe planu (0 = poniedziałek). Pusta lista = bez dni tygodnia. */
export async function setPlanWeekdays(db: Db, planId: string, weekdays: number[]): Promise<void> {
  const value = parseWeekdays(weekdays.join(','));
  await db.run('UPDATE plan SET weekdays = ? WHERE id = ?', [
    value ? value.join(',') : null,
    planId,
  ]);
}
