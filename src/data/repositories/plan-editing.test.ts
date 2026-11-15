// Edycja planów z ekranów F5: kolejność, usuwanie, parametry ćwiczeń.
import { translate } from '@/i18n';
import pl from '@/i18n/locales/pl.json';

import { migrate } from '../migrations';
import { BUILTIN_PROGRAMS } from '../seed/programs';
import { seedBuiltinData } from '../seed/seed';
import { createTestDb } from '../testing/nodeDb';
import { exercisePlanCount } from './exercises';
import {
  addPlanDay,
  addPlanExercise,
  copyProgram,
  createPlan,
  deletePlanDay,
  deletePlanExercise,
  getPlan,
  getPlanDay,
  getPlanExercise,
  listPlanSummaries,
  renamePlanDay,
  reorderPlanDays,
  reorderPlanExercises,
  setActivePlan,
  uniquePlanName,
  updatePlan,
  updatePlanExercise,
} from './plans';

const tr = (key: string) => translate(pl, key) ?? key;

async function freshDb() {
  const db = createTestDb();
  await migrate(db);
  await seedBuiltinData(db);
  return db;
}

const item = (exerciseId: string) => ({
  exerciseId,
  targetSets: 3,
  repsMin: 8,
  repsMax: 12,
  targetWeightKg: null,
  targetDurationSec: null,
  restSec: 90,
  note: null,
});

async function planWithDays(db: Awaited<ReturnType<typeof freshDb>>) {
  const planId = await createPlan(db, { name: 'Mój plan' });
  const days = [
    await addPlanDay(db, planId, 'A'),
    await addPlanDay(db, planId, 'B'),
    await addPlanDay(db, planId, 'C'),
  ];
  return { planId, days };
}

describe('edycja planu', () => {
  it('zmienia nazwę, opis i poziom; pusty opis zapisuje jako brak', async () => {
    const db = await freshDb();
    const planId = await createPlan(db, { name: 'Stary' });
    await updatePlan(db, planId, { name: '  Nowy ', description: '  ', level: 'advanced' });
    expect(await getPlan(db, planId)).toMatchObject({
      name: 'Nowy',
      description: null,
      level: 'advanced',
    });
    await expect(updatePlan(db, planId, { name: ' ' })).rejects.toThrow();
  });

  it('podsumowania: liczba dni i ćwiczeń, aktywny na górze', async () => {
    const db = await freshDb();
    const program = BUILTIN_PROGRAMS.find((p) => p.id === 'push-pull-legs')!;
    const copied = await copyProgram(db, program, tr);
    const own = await createPlan(db, { name: 'Pusty' });
    await setActivePlan(db, copied);

    const summaries = await listPlanSummaries(db);
    expect(summaries.map((s) => s.id)).toEqual([copied, own]);
    expect(summaries[0]).toMatchObject({
      isActive: true,
      dayCount: program.days.length,
      exerciseCount: program.days.reduce((sum, d) => sum + d.exercises.length, 0),
    });
    expect(summaries[1]).toMatchObject({ dayCount: 0, exerciseCount: 0 });
  });

  it('kolejne kopie tego samego programu dostają numer w nazwie', async () => {
    const db = await freshDb();
    const program = BUILTIN_PROGRAMS[0];
    const base = tr(`programs.${program.id}.name`);
    const ids = [
      await copyProgram(db, program, tr),
      await copyProgram(db, program, tr),
      await copyProgram(db, program, tr),
    ];
    const names = await Promise.all(ids.map(async (id) => (await getPlan(db, id))!.name));
    expect(names).toEqual([base, `${base} (2)`, `${base} (3)`]);
  });

  it('wolna nazwa: bez zmian, zajęta: pierwszy wolny numer', () => {
    expect(uniquePlanName('Plan', [])).toBe('Plan');
    expect(uniquePlanName('Plan', ['Plan'])).toBe('Plan (2)');
    expect(uniquePlanName('Plan', ['Plan', 'Plan (2)', 'Plan (4)'])).toBe('Plan (3)');
  });
});

describe('dni planu', () => {
  it('zmiana kolejności dni', async () => {
    const db = await freshDb();
    const { planId, days } = await planWithDays(db);
    await reorderPlanDays(db, planId, [days[2], days[0], days[1]]);
    const plan = await getPlan(db, planId);
    expect(plan?.days.map((d) => [d.name, d.position])).toEqual([
      ['C', 0],
      ['A', 1],
      ['B', 2],
    ]);
  });

  it('nieaktualna lista kolejności jest odrzucana i nic nie zmienia', async () => {
    const db = await freshDb();
    const { planId, days } = await planWithDays(db);
    await expect(reorderPlanDays(db, planId, [days[1], days[0]])).rejects.toThrow();
    await expect(reorderPlanDays(db, planId, [days[0], days[0], days[1]])).rejects.toThrow();
    await expect(reorderPlanDays(db, planId, [days[0], days[1], 'obcy'])).rejects.toThrow();
    const plan = await getPlan(db, planId);
    expect(plan?.days.map((d) => d.name)).toEqual(['A', 'B', 'C']);
  });

  it('usunięcie dnia domyka numerację, a nowy dzień trafia na koniec', async () => {
    const db = await freshDb();
    const { planId, days } = await planWithDays(db);
    await deletePlanDay(db, days[0]);
    await addPlanDay(db, planId, 'D');
    const plan = await getPlan(db, planId);
    expect(plan?.days.map((d) => [d.name, d.position])).toEqual([
      ['B', 0],
      ['C', 1],
      ['D', 2],
    ]);
  });

  it('zmiana nazwy dnia; pusta nazwa odrzucona', async () => {
    const db = await freshDb();
    const { days } = await planWithDays(db);
    await renamePlanDay(db, days[1], ' Nogi ');
    expect((await getPlanDay(db, days[1]))?.name).toBe('Nogi');
    await expect(renamePlanDay(db, days[1], '')).rejects.toThrow();
  });
});

describe('ćwiczenia w dniu', () => {
  it('zmiana kolejności, edycja parametrów i usunięcie z domknięciem numeracji', async () => {
    const db = await freshDb();
    const { planId, days } = await planWithDays(db);
    const a = await addPlanExercise(db, days[0], item('bench-press'));
    const b = await addPlanExercise(db, days[0], item('back-squat'));
    const c = await addPlanExercise(db, days[0], item('deadlift'));

    await reorderPlanExercises(db, days[0], [c, a, b]);
    await updatePlanExercise(db, a, {
      targetSets: 5,
      repsMin: 5,
      repsMax: 5,
      targetWeightKg: 80,
      targetDurationSec: null,
      restSec: 180,
      note: '  pauza na klatce ',
    });
    expect(await getPlanExercise(db, a)).toMatchObject({
      position: 1,
      targetSets: 5,
      targetWeightKg: 80,
      restSec: 180,
      note: 'pauza na klatce',
    });

    await deletePlanExercise(db, c);
    const day = await getPlanDay(db, days[0]);
    expect(day).toMatchObject({ planId });
    expect(day?.exercises.map((e) => [e.exerciseId, e.position])).toEqual([
      ['bench-press', 0],
      ['back-squat', 1],
    ]);
  });

  it('baza odrzuca zakres powtórzeń od większego do mniejszego', async () => {
    const db = await freshDb();
    const { days } = await planWithDays(db);
    const a = await addPlanExercise(db, days[0], item('bench-press'));
    await expect(
      updatePlanExercise(db, a, { ...item('bench-press'), repsMin: 12, repsMax: 8 }),
    ).rejects.toThrow();
  });

  it('liczy plany, w których jest ćwiczenie', async () => {
    const db = await freshDb();
    const { days } = await planWithDays(db);
    const other = await planWithDays(db);
    await addPlanExercise(db, days[0], item('bench-press'));
    await addPlanExercise(db, days[1], item('bench-press'));
    await addPlanExercise(db, other.days[0], item('bench-press'));
    expect(await exercisePlanCount(db, 'bench-press')).toBe(2);
    expect(await exercisePlanCount(db, 'back-squat')).toBe(0);
  });
});
