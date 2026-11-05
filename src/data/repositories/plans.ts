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

const PLAN_COLUMNS = 'id, name, description, level, source_program_id, is_active, created_at';

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    level: row.level,
    sourceProgramId: row.source_program_id,
    isActive: fromFlag(row.is_active),
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
    await tx.run(
      `INSERT INTO plan (id, name, description, level, source_program_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        planId,
        translate(`programs.${program.id}.name`),
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
