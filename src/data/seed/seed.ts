// Wstawia i odświeża gotowe ćwiczenia. Nie rusza danych użytkownika ani tego, że coś ukrył.
import type { Db } from '../db';
import { nowIso } from '../ids';
import { getSetting, setSetting } from '../repositories/settings';
import { BUILTIN_EXERCISES, EXERCISES_VERSION } from './exercises';

const VERSION_KEY = 'seed.exercisesVersion';

export async function seedBuiltinData(db: Db): Promise<{ updated: boolean }> {
  const current = await getSetting(db, VERSION_KEY, 0);
  if (current >= EXERCISES_VERSION) return { updated: false };

  await db.transaction(async (tx) => {
    const createdAt = nowIso();
    for (const exercise of BUILTIN_EXERCISES) {
      await tx.run(
        `INSERT INTO exercise (id, source, type, primary_muscles, secondary_muscles, equipment, created_at)
         VALUES (?, 'builtin', ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           type = excluded.type,
           primary_muscles = excluded.primary_muscles,
           secondary_muscles = excluded.secondary_muscles,
           equipment = excluded.equipment
         WHERE exercise.source = 'builtin'`,
        [
          exercise.id,
          exercise.type,
          JSON.stringify(exercise.primaryMuscles),
          JSON.stringify(exercise.secondaryMuscles),
          exercise.equipment,
          createdAt,
        ],
      );
    }
    await setSetting(tx, VERSION_KEY, EXERCISES_VERSION);
  });
  return { updated: true };
}
