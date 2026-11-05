import { computeRecords } from '@/domain/records';
import { suggestNextWeight } from '@/domain/suggestion';
import { translate } from '@/i18n';
import pl from '@/i18n/locales/pl.json';

import { migrate } from '../migrations';
import { BUILTIN_PROGRAMS } from '../seed/programs';
import { seedBuiltinData } from '../seed/seed';
import { createTestDb } from '../testing/nodeDb';
import { deleteBodyweight, latestBodyweight, listBodyweight, saveBodyweight } from './bodyweight';
import {
  createCustomExercise,
  listExercises,
  setExerciseHidden,
  updateCustomExercise,
} from './exercises';
import {
  addPlanDay,
  addPlanExercise,
  copyProgram,
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  setActivePlan,
} from './plans';
import { getSetting, setSetting } from './settings';
import {
  addSet,
  addWorkoutExercise,
  deleteWorkout,
  exerciseHistory,
  finishWorkout,
  getUnfinishedWorkout,
  getWorkout,
  lastSetsForExercise,
  listWorkouts,
  startWorkout,
  updateSet,
} from './workouts';

const tr = (key: string) => translate(pl, key) ?? key;

async function freshDb() {
  const db = createTestDb();
  await migrate(db);
  await seedBuiltinData(db);
  return db;
}

describe('ćwiczenia', () => {
  it('własne ćwiczenie: dodanie, edycja, ukrycie', async () => {
    const db = await freshDb();
    const id = await createCustomExercise(db, {
      name: '  Wyciskanie na maszynie X  ',
      type: 'weight_reps',
      primaryMuscles: ['chest'],
      equipment: 'machine',
    });
    await updateCustomExercise(db, id, {
      name: 'Wyciskanie na maszynie Y',
      type: 'weight_reps',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      equipment: 'machine',
    });
    const all = await listExercises(db);
    expect(all.find((e) => e.id === id)).toMatchObject({
      name: 'Wyciskanie na maszynie Y',
      secondaryMuscles: ['triceps'],
      source: 'user',
    });

    await setExerciseHidden(db, id, true);
    expect((await listExercises(db)).some((e) => e.id === id)).toBe(false);
    expect((await listExercises(db, { includeHidden: true })).some((e) => e.id === id)).toBe(true);
  });

  it('pusta nazwa i edycja gotowego ćwiczenia są odrzucane', async () => {
    const db = await freshDb();
    const input = {
      name: ' ',
      type: 'weight_reps' as const,
      primaryMuscles: ['chest' as const],
      equipment: 'machine' as const,
    };
    await expect(createCustomExercise(db, input)).rejects.toThrow('pusta');
    await expect(updateCustomExercise(db, 'bench-press', { ...input, name: 'X' })).rejects.toThrow(
      'własne',
    );
  });
});

describe('plany', () => {
  it('kopiowanie gotowego programu tworzy pełny, edytowalny plan', async () => {
    const db = await freshDb();
    const program = BUILTIN_PROGRAMS.find((p) => p.id === 'push-pull-legs')!;
    const planId = await copyProgram(db, program, tr);
    const plan = await getPlan(db, planId);

    expect(plan).toMatchObject({
      name: 'Push / Pull / Nogi',
      level: 'intermediate',
      sourceProgramId: 'push-pull-legs',
      isActive: false,
    });
    expect(plan?.days.map((d) => d.name)).toEqual(['Push', 'Pull', 'Nogi']);
    expect(plan?.days[0].exercises[0]).toMatchObject({
      exerciseId: 'bench-press',
      position: 0,
      targetSets: 4,
      repsMin: 6,
      repsMax: 10,
      restSec: 150,
    });
  });

  it('każdy gotowy program da się skopiować', async () => {
    const db = await freshDb();
    for (const program of BUILTIN_PROGRAMS) {
      const plan = await getPlan(db, await copyProgram(db, program, tr));
      expect(plan?.days).toHaveLength(program.days.length);
    }
  });

  it('własny plan: dni i ćwiczenia w kolejności dodania', async () => {
    const db = await freshDb();
    const planId = await createPlan(db, { name: 'Mój plan' });
    const dayA = await addPlanDay(db, planId, 'A');
    await addPlanDay(db, planId, 'B');
    const base = {
      targetSets: 3,
      repsMin: 8,
      repsMax: 12,
      targetWeightKg: null,
      targetDurationSec: null,
      restSec: 90,
      note: null,
    };
    await addPlanExercise(db, dayA, { ...base, exerciseId: 'back-squat' });
    await addPlanExercise(db, dayA, { ...base, exerciseId: 'leg-press' });

    const plan = await getPlan(db, planId);
    expect(plan?.days.map((d) => [d.name, d.position])).toEqual([
      ['A', 0],
      ['B', 1],
    ]);
    expect(plan?.days[0].exercises.map((e) => [e.exerciseId, e.position])).toEqual([
      ['back-squat', 0],
      ['leg-press', 1],
    ]);
  });

  it('tylko jeden plan aktywny, aktywny na górze listy', async () => {
    const db = await freshDb();
    const a = await createPlan(db, { name: 'A' });
    const b = await createPlan(db, { name: 'B' });
    await setActivePlan(db, a);
    await setActivePlan(db, b);
    const plans = await listPlans(db);
    expect(plans.filter((p) => p.isActive).map((p) => p.id)).toEqual([b]);
    expect(plans[0].id).toBe(b);
  });

  it('usunięcie planu usuwa dni, ale trening z historii zostaje', async () => {
    const db = await freshDb();
    const planId = await copyProgram(db, BUILTIN_PROGRAMS[0], tr);
    const dayId = (await getPlan(db, planId))!.days[0].id;
    const workoutId = await startWorkout(db, { planDayId: dayId });

    await deletePlan(db, planId);
    expect(await getPlan(db, planId)).toBeNull();
    expect(await db.all('SELECT id FROM plan_day WHERE plan_id = ?', [planId])).toEqual([]);
    expect((await getWorkout(db, workoutId))?.planDayId).toBeNull();
  });
});

describe('treningi', () => {
  async function logWorkout(
    db: Awaited<ReturnType<typeof freshDb>>,
    startedAt: string,
    sets: [number, number][],
    finished = true,
  ) {
    const workoutId = await startWorkout(db, { startedAt, bodyweightKg: 80 });
    const we = await addWorkoutExercise(db, workoutId, 'bench-press');
    await addSet(db, we, { kind: 'warmup', reps: 10, weightKg: 40, completedAt: startedAt });
    for (const [reps, weightKg] of sets) {
      await addSet(db, we, { reps, weightKg, completedAt: startedAt });
    }
    if (finished) await finishWorkout(db, workoutId, startedAt);
    return workoutId;
  }

  it('zapis i odczyt treningu z seriami w kolejności', async () => {
    const db = await freshDb();
    const id = await logWorkout(db, '2026-10-01T10:00:00Z', [
      [8, 60],
      [7, 60],
    ]);
    const workout = await getWorkout(db, id);
    expect(workout?.exercises).toHaveLength(1);
    expect(workout?.exercises[0].sets.map((s) => [s.kind, s.reps, s.weightKg, s.position])).toEqual(
      [
        ['warmup', 10, 40, 0],
        ['working', 8, 60, 1],
        ['working', 7, 60, 2],
      ],
    );
  });

  it('niezakończony trening da się odnaleźć po ponownym uruchomieniu', async () => {
    const db = await freshDb();
    const id = await logWorkout(db, '2026-10-01T10:00:00Z', [[8, 60]], false);
    expect((await getUnfinishedWorkout(db))?.id).toBe(id);
    expect(await listWorkouts(db)).toEqual([]);
    await finishWorkout(db, id);
    expect(await getUnfinishedWorkout(db)).toBeNull();
  });

  it('edycja serii i usunięcie treningu z seriami', async () => {
    const db = await freshDb();
    const id = await logWorkout(db, '2026-10-01T10:00:00Z', [[8, 60]]);
    const setId = (await getWorkout(db, id))!.exercises[0].sets[1].id;
    await updateSet(db, setId, { reps: 9, weightKg: 62.5, completedAt: '2026-10-01T10:05:00Z' });
    expect((await getWorkout(db, id))!.exercises[0].sets[1]).toMatchObject({
      reps: 9,
      weightKg: 62.5,
      kind: 'working',
    });

    await deleteWorkout(db, id);
    expect(await getWorkout(db, id)).toBeNull();
    expect(await db.all('SELECT id FROM workout_set')).toEqual([]);
  });

  it('pełna ścieżka: historia → rekordy i podpowiedź ciężaru', async () => {
    const db = await freshDb();
    await logWorkout(db, '2026-10-01T10:00:00Z', [
      [10, 60],
      [10, 60],
      [10, 60],
    ]);
    const lastId = await logWorkout(db, '2026-10-08T10:00:00Z', [
      [10, 62.5],
      [10, 62.5],
      [9, 62.5],
    ]);

    const history = await exerciseHistory(db, 'bench-press');
    expect(history).toHaveLength(8);
    const records = computeRecords('weight_reps', history);
    expect(records.heaviestWeight).toMatchObject({ value: 62.5, workoutId: lastId });

    const last = await lastSetsForExercise(db, 'bench-press');
    expect(suggestNextWeight({ type: 'weight_reps', lastSets: last, repsMax: 10 })).toEqual({
      weightKg: 62.5,
      reason: 'same',
    });
    expect((await listWorkouts(db)).map((w) => w.id)[0]).toBe(lastId);
  });

  it('ćwiczenia z historią nie da się usunąć z bazy (tylko ukryć)', async () => {
    const db = await freshDb();
    await logWorkout(db, '2026-10-01T10:00:00Z', [[8, 60]]);
    await expect(db.run("DELETE FROM exercise WHERE id = 'bench-press'")).rejects.toThrow(
      /FOREIGN KEY/,
    );
  });
});

describe('masa ciała i ustawienia', () => {
  it('jeden wpis na dzień, najnowszy na końcu', async () => {
    const db = await freshDb();
    await saveBodyweight(db, '2026-11-01', 80.4);
    await saveBodyweight(db, '2026-11-03', 80.1);
    await saveBodyweight(db, '2026-11-01', 80.2);
    expect((await listBodyweight(db)).map((e) => [e.date, e.weightKg])).toEqual([
      ['2026-11-01', 80.2],
      ['2026-11-03', 80.1],
    ]);
    const latest = await latestBodyweight(db);
    expect(latest?.weightKg).toBe(80.1);
    await deleteBodyweight(db, latest!.id);
    expect(await listBodyweight(db)).toHaveLength(1);
  });

  it('odrzuca złą datę i masę', async () => {
    const db = await freshDb();
    await expect(saveBodyweight(db, '1.11.2026', 80)).rejects.toThrow('RRRR-MM-DD');
    await expect(saveBodyweight(db, '2026-11-01', 0)).rejects.toThrow('większa');
  });

  it('ustawienia: wartość domyślna, zapis i nadpisanie', async () => {
    const db = await freshDb();
    expect(await getSetting(db, 'weightStepKg', 2.5)).toBe(2.5);
    await setSetting(db, 'weightStepKg', 1.25);
    await setSetting(db, 'weightStepKg', 2);
    expect(await getSetting(db, 'weightStepKg', 2.5)).toBe(2);
  });
});
