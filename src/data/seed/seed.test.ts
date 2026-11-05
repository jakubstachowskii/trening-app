import { MUSCLES, EQUIPMENT } from '../models';
import { migrate } from '../migrations';
import {
  createCustomExercise,
  getExercise,
  listExercises,
  setExerciseHidden,
} from '../repositories/exercises';
import { setSetting } from '../repositories/settings';
import { createTestDb } from '../testing/nodeDb';
import { BUILTIN_EXERCISES } from './exercises';
import { BUILTIN_PROGRAMS } from './programs';
import { seedBuiltinData } from './seed';
import pl from '@/i18n/locales/pl.json';

async function freshDb() {
  const db = createTestDb();
  await migrate(db);
  return db;
}

describe('dane gotowe', () => {
  const ids = BUILTIN_EXERCISES.map((e) => e.id);

  it('id ćwiczeń są unikalne i w formacie kebab-case', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('każde ćwiczenie ma polską nazwę, a w tłumaczeniach nie ma nazw bez ćwiczenia', () => {
    expect(Object.keys(pl.exercises).sort()).toEqual([...ids].sort());
  });

  it('mięśnie i sprzęt pochodzą z listy, a każde ćwiczenie ma główną partię', () => {
    for (const e of BUILTIN_EXERCISES) {
      expect(e.primaryMuscles.length).toBeGreaterThan(0);
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) expect(MUSCLES).toContain(m);
      expect(EQUIPMENT).toContain(e.equipment);
    }
    expect(Object.keys(pl.muscles).sort()).toEqual([...MUSCLES].sort());
    expect(Object.keys(pl.equipment).sort()).toEqual([...EQUIPMENT].sort());
  });

  it('programy używają tylko istniejących ćwiczeń i mają teksty', () => {
    const programs = pl.programs as Record<string, { name: string; days: Record<string, string> }>;
    for (const program of BUILTIN_PROGRAMS) {
      expect(programs[program.id]?.name).toBeTruthy();
      for (const day of program.days) {
        expect(programs[program.id].days[day.key]).toBeTruthy();
        for (const item of day.exercises) {
          expect(ids).toContain(item.exerciseId);
          const isTime = BUILTIN_EXERCISES.find((e) => e.id === item.exerciseId)?.type === 'time';
          expect(isTime ? item.durationSec : item.repsMax).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('seedBuiltinData', () => {
  it('pierwsze uruchomienie wstawia wszystkie gotowe ćwiczenia', async () => {
    const db = await freshDb();
    expect(await seedBuiltinData(db)).toEqual({ updated: true });
    expect(await listExercises(db)).toHaveLength(BUILTIN_EXERCISES.length);
    expect(await getExercise(db, 'bench-press')).toMatchObject({
      source: 'builtin',
      name: null,
      type: 'weight_reps',
      equipment: 'barbell',
      primaryMuscles: ['chest'],
    });
  });

  it('kolejne uruchomienie nic nie robi', async () => {
    const db = await freshDb();
    await seedBuiltinData(db);
    expect(await seedBuiltinData(db)).toEqual({ updated: false });
  });

  it('aktualizacja danych nie odkrywa ukrytych ćwiczeń i nie rusza własnych', async () => {
    const db = await freshDb();
    await seedBuiltinData(db);
    await setExerciseHidden(db, 'bench-press', true);
    const customId = await createCustomExercise(db, {
      name: 'Moje wiosłowanie',
      type: 'weight_reps',
      primaryMuscles: ['lats'],
      equipment: 'machine',
    });
    await db.run("UPDATE exercise SET equipment = 'other' WHERE id = 'deadlift'");

    await setSetting(db, 'seed.exercisesVersion', 0); // symulacja nowej wersji aplikacji
    expect(await seedBuiltinData(db)).toEqual({ updated: true });

    expect((await getExercise(db, 'bench-press'))?.isHidden).toBe(true);
    expect((await getExercise(db, 'deadlift'))?.equipment).toBe('barbell');
    expect(await getExercise(db, customId)).toMatchObject({ name: 'Moje wiosłowanie' });
  });
});
