import { migrate } from '../migrations';
import { seedBuiltinData } from '../seed/seed';
import { createTestDb } from '../testing/nodeDb';
import { addPlanDay, addPlanExercise, createPlan } from './plans';
import {
  addExerciseToWorkout,
  addSet,
  completeWorkout,
  deleteSet,
  deleteWorkoutExercise,
  getUnfinishedWorkout,
  getWorkout,
  lastFinishedDayForPlan,
  listWorkouts,
  replaceWorkoutExercise,
  setWorkoutExerciseNote,
  setWorkoutNote,
  startEmptyWorkout,
  startWorkoutFromDay,
  updateSet,
} from './workouts';

type TestDb = ReturnType<typeof createTestDb>;

async function freshDb(): Promise<TestDb> {
  const db = createTestDb();
  await migrate(db);
  await seedBuiltinData(db);
  return db;
}

async function planWithDay(db: TestDb) {
  const planId = await createPlan(db, { name: 'Mój plan' });
  const dayA = await addPlanDay(db, planId, 'Push A');
  const dayB = await addPlanDay(db, planId, 'Pull B');
  await addPlanExercise(db, dayA, {
    exerciseId: 'bench-press',
    targetSets: 3,
    repsMin: 8,
    repsMax: 10,
    targetWeightKg: 60,
    targetDurationSec: null,
    restSec: 150,
    note: null,
  });
  await addPlanExercise(db, dayA, {
    exerciseId: 'plank',
    targetSets: 2,
    repsMin: null,
    repsMax: null,
    targetWeightKg: null,
    targetDurationSec: 45,
    restSec: null,
    note: null,
  });
  return { planId, dayA, dayB };
}

async function completeAll(db: TestDb, workoutId: string, at: string) {
  const workout = await getWorkout(db, workoutId);
  for (const e of workout!.exercises) {
    for (const s of e.sets) await updateSet(db, s.id, { ...s, completedAt: at });
  }
}

describe('trening z dnia planu', () => {
  it('kopiuje nazwę dnia, cele i wypełnia serie z planu', async () => {
    const db = await freshDb();
    const { dayA } = await planWithDay(db);
    const id = await startWorkoutFromDay(db, dayA, { startedAt: '2026-11-01T10:00:00Z' });

    const workout = await getWorkout(db, id);
    expect(workout).toMatchObject({ name: 'Push A', planDayId: dayA, finishedAt: null });
    const [bench, plank] = workout!.exercises;
    expect(bench).toMatchObject({
      exerciseId: 'bench-press',
      restSec: 150,
      repsMin: 8,
      repsMax: 10,
    });
    expect(bench.sets.map((s) => [s.weightKg, s.reps, s.completedAt])).toEqual([
      [60, 10, null],
      [60, 10, null],
      [60, 10, null],
    ]);
    expect(plank).toMatchObject({ exerciseId: 'plank', targetDurationSec: 45 });
    expect(plank.sets.map((s) => s.durationSec)).toEqual([45, 45]);
  });

  it('kolejny trening bierze ciężar z poprzedniego i podnosi go po górnym zakresie', async () => {
    const db = await freshDb();
    const { dayA } = await planWithDay(db);
    const first = await startWorkoutFromDay(db, dayA, { startedAt: '2026-11-01T10:00:00Z' });
    await completeAll(db, first, '2026-11-01T10:30:00Z');
    expect(await completeWorkout(db, first, '2026-11-01T11:00:00Z')).toBe('finished');

    const second = await startWorkoutFromDay(db, dayA, { startedAt: '2026-11-03T10:00:00Z' });
    const bench = (await getWorkout(db, second))!.exercises[0];
    expect(bench.sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [62.5, 8],
      [62.5, 8],
      [62.5, 8],
    ]);
  });

  it('nieznany dzień: błąd i nic nie zostaje w bazie', async () => {
    const db = await freshDb();
    await expect(startWorkoutFromDay(db, 'nie-ma')).rejects.toThrow();
    expect(await getUnfinishedWorkout(db)).toBeNull();
  });
});

describe('zmiany w trakcie', () => {
  it('dodanie, zamiana i usunięcie ćwiczenia, notatki', async () => {
    const db = await freshDb();
    const id = await startEmptyWorkout(db, { startedAt: '2026-11-01T10:00:00Z' });
    const a = await addExerciseToWorkout(db, id, 'bench-press');
    const b = await addExerciseToWorkout(db, id, 'back-squat');
    let workout = await getWorkout(db, id);
    expect(workout!.name).toBeNull();
    expect(workout!.exercises.map((e) => [e.exerciseId, e.position, e.sets.length])).toEqual([
      ['bench-press', 0, 3],
      ['back-squat', 1, 3],
    ]);

    await replaceWorkoutExercise(db, a, 'plank');
    await setWorkoutExerciseNote(db, b, '  ból kolana  ');
    await setWorkoutNote(db, id, '   ');
    workout = await getWorkout(db, id);
    expect(workout!.exercises[0]).toMatchObject({ id: a, exerciseId: 'plank' });
    expect(workout!.exercises[0].sets).toHaveLength(3);
    expect(workout!.exercises[1].note).toBe('ból kolana');
    expect(workout!.note).toBeNull();

    await deleteWorkoutExercise(db, a);
    workout = await getWorkout(db, id);
    expect(workout!.exercises.map((e) => [e.id, e.position])).toEqual([[b, 0]]);
  });

  it('usunięcie serii przenumerowuje, nowa seria idzie na koniec', async () => {
    const db = await freshDb();
    const id = await startEmptyWorkout(db);
    const we = await addExerciseToWorkout(db, id, 'bench-press');
    const sets = (await getWorkout(db, id))!.exercises[0].sets;
    await deleteSet(db, sets[0].id);
    const added = await addSet(db, we, { reps: 5 });
    const after = (await getWorkout(db, id))!.exercises[0].sets;
    expect(after.map((s) => s.position)).toEqual([0, 1, 2]);
    expect(after[2].id).toBe(added);
  });
});

describe('zakończenie', () => {
  it('usuwa nieodhaczone serie i puste ćwiczenia', async () => {
    const db = await freshDb();
    const { dayA } = await planWithDay(db);
    const id = await startWorkoutFromDay(db, dayA);
    const bench = (await getWorkout(db, id))!.exercises[0];
    await updateSet(db, bench.sets[1].id, {
      ...bench.sets[1],
      completedAt: '2026-11-01T10:05:00Z',
    });

    expect(await completeWorkout(db, id, '2026-11-01T11:00:00Z')).toBe('finished');
    const workout = await getWorkout(db, id);
    expect(workout!.finishedAt).toBe('2026-11-01T11:00:00Z');
    expect(workout!.exercises).toHaveLength(1);
    expect(workout!.exercises[0].sets.map((s) => [s.id, s.position])).toEqual([
      [bench.sets[1].id, 0],
    ]);
  });

  it('trening bez odhaczonych serii jest porzucany', async () => {
    const db = await freshDb();
    const { dayA } = await planWithDay(db);
    const id = await startWorkoutFromDay(db, dayA);
    expect(await completeWorkout(db, id)).toBe('discarded');
    expect(await getWorkout(db, id)).toBeNull();
    expect(await listWorkouts(db)).toEqual([]);
  });

  it('ostatni zrobiony dzień planu', async () => {
    const db = await freshDb();
    const { planId, dayA } = await planWithDay(db);
    expect(await lastFinishedDayForPlan(db, planId)).toBeNull();
    const id = await startWorkoutFromDay(db, dayA);
    await completeAll(db, id, '2026-11-01T10:30:00Z');
    await completeWorkout(db, id);
    expect(await lastFinishedDayForPlan(db, planId)).toBe(dayA);
  });
});
