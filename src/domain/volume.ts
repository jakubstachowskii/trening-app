import { type ExerciseType, isCountedSet, type LoggedSet } from './types';
import { roundWeight } from './units';

/**
 * Obciążenie, które faktycznie unosi użytkownik. Dla ćwiczeń z masą ciała potrzebna jest masa ciała —
 * bez niej nie zgadujemy (null). Ćwiczenia na czas nie mają obciążenia.
 */
export function effectiveLoadKg(
  type: ExerciseType,
  weightKg: number | null | undefined,
  bodyweightKg: number | null | undefined,
): number | null {
  const added = weightKg ?? 0;
  switch (type) {
    case 'weight_reps':
      return weightKg ?? null;
    case 'bodyweight_reps':
      return bodyweightKg ?? null;
    case 'weighted_bodyweight':
      return bodyweightKg == null ? null : bodyweightKg + added;
    case 'assisted_bodyweight':
      return bodyweightKg == null ? null : Math.max(0, bodyweightKg - added);
    case 'time':
      return null;
  }
}

export function setVolumeKg(
  type: ExerciseType,
  set: LoggedSet,
  bodyweightKg: number | null | undefined,
): number {
  const load = effectiveLoadKg(type, set.weightKg, bodyweightKg);
  if (load == null || !set.reps) return 0;
  return roundWeight(load * set.reps);
}

export type ExerciseSets = { type: ExerciseType; sets: LoggedSet[] };

/** Objętość treningu: suma ukończonych serii roboczych (rozgrzewka się nie liczy). */
export function workoutVolumeKg(
  exercises: ExerciseSets[],
  bodyweightKg: number | null | undefined,
): number {
  let total = 0;
  for (const { type, sets } of exercises) {
    for (const set of sets) {
      if (isCountedSet(set)) total += setVolumeKg(type, set, bodyweightKg);
    }
  }
  return roundWeight(total);
}

export function totalDurationSec(sets: LoggedSet[]): number {
  return sets.filter(isCountedSet).reduce((sum, set) => sum + (set.durationSec ?? 0), 0);
}
