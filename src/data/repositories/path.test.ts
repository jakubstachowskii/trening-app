// Wybór planu jednym ruchem, własny plan od razu aktywny i treningi z zakresu dat.
import { translate } from '@/i18n';
import pl from '@/i18n/locales/pl.json';

import { migrate } from '../migrations';
import { BUILTIN_PROGRAMS } from '../seed/programs';
import { seedBuiltinData } from '../seed/seed';
import { createTestDb } from '../testing/nodeDb';
import { chooseProgram, createOwnPlan, getPlan, listPlans, updatePlan } from './plans';
import { finishWorkout, listFinishedBetween, startWorkout } from './workouts';

const tr = (key: string) => translate(pl, key) ?? key;
const fullBody = BUILTIN_PROGRAMS.find((p) => p.id === 'full-body-3')!;
const ppl = BUILTIN_PROGRAMS.find((p) => p.id === 'push-pull-legs')!;

async function freshDb() {
  const db = createTestDb();
  await migrate(db);
  await seedBuiltinData(db);
  return db;
}

describe('wybór gotowego planu', () => {
  it('kopiuje program i od razu ustawia go jako aktywny', async () => {
    const db = await freshDb();
    const id = await chooseProgram(db, fullBody, tr);
    const plans = await listPlans(db);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ id, isActive: true, sourceProgramId: 'full-body-3' });
  });

  it('drugi wybór tego samego programu nie robi duplikatu, tylko przełącza na istniejącą kopię', async () => {
    const db = await freshDb();
    const first = await chooseProgram(db, fullBody, tr);
    await updatePlan(db, first, { name: 'Mój FBW' });
    await chooseProgram(db, ppl, tr);
    const again = await chooseProgram(db, fullBody, tr);
    expect(again).toBe(first);
    const plans = await listPlans(db);
    expect(plans).toHaveLength(2);
    expect(plans.find((p) => p.isActive)?.name).toBe('Mój FBW');
  });
});

describe('własny plan', () => {
  it('od razu aktywny, z pierwszym treningiem', async () => {
    const db = await freshDb();
    await chooseProgram(db, fullBody, tr);
    const { planId, dayId } = await createOwnPlan(db, 'Siłownia', 'Trening A');
    const plan = await getPlan(db, planId);
    expect(plan?.isActive).toBe(true);
    expect(plan?.days.map((d) => [d.id, d.name])).toEqual([[dayId, 'Trening A']]);
    expect((await listPlans(db)).filter((p) => p.isActive)).toHaveLength(1);
  });

  it('pusta nazwa jest odrzucana', async () => {
    const db = await freshDb();
    await expect(createOwnPlan(db, '  ', 'Trening A')).rejects.toThrow();
  });
});

describe('treningi z zakresu dat', () => {
  it('tylko zakończone, rozpoczęte w [od, do), od najstarszego', async () => {
    const db = await freshDb();
    const add = async (iso: string, finished = true) => {
      const id = await startWorkout(db, { startedAt: iso });
      if (finished) await finishWorkout(db, id, iso);
      return id;
    };
    const before = await add('2026-11-15T23:00:00.000Z');
    const a = await add('2026-11-16T10:00:00.000Z');
    const b = await add('2026-11-18T10:00:00.000Z');
    await add('2026-11-19T10:00:00.000Z', false);
    const after = await add('2026-11-23T00:00:00.000Z');
    const rows = await listFinishedBetween(
      db,
      '2026-11-16T00:00:00.000Z',
      '2026-11-23T00:00:00.000Z',
    );
    expect(rows.map((w) => w.id)).toEqual([a, b]);
    expect([before, after]).not.toContain(rows[0].id);
  });
});
