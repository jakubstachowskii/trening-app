// Serie wypełniane przy starcie treningu: z ostatniego treningu, podpowiedzi ciężaru i celu planu.
import { suggestNextWeight } from '../suggestion';
import { type ExerciseType, isCountedSet, type LoggedSet } from '../types';

/** Typy, w których wpisuje się ciężar (sztanga, obciążnik albo pomoc gumy). */
export const WEIGHT_INPUT_TYPES: readonly ExerciseType[] = [
  'weight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
];

export const usesWeight = (type: ExerciseType): boolean => WEIGHT_INPUT_TYPES.includes(type);
export const usesDuration = (type: ExerciseType): boolean => type === 'time';
export const usesReps = (type: ExerciseType): boolean => type !== 'time';

/** Liczba serii, gdy nie ma planu ani historii (ćwiczenie dodane w trakcie). */
export const DEFAULT_SET_COUNT = 3;

export type PrefillTarget = {
  targetSets?: number | null;
  repsMin?: number | null;
  repsMax?: number | null;
  targetWeightKg?: number | null;
  targetDurationSec?: number | null;
};

export type PrefilledSet = {
  kind: 'working';
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
};

type Input = {
  type: ExerciseType;
  target: PrefillTarget;
  /** Serie tego ćwiczenia z ostatniego zakończonego treningu. */
  lastSets: LoggedSet[];
  stepKg?: number;
};

/**
 * Zasady: liczba serii z planu (bez planu: tyle, ile ostatnio, albo 3).
 * Ciężar: podpowiedź „+ krok”, gdy ostatnio doszło się do górnego zakresu; inaczej ciężar z tej samej
 * serii ostatnio, potem cel planu. Powtórzenia: cel = górny zakres (po zwiększeniu ciężaru: dolny);
 * bez zakresu: tyle, ile ostatnio. Czas: cel planu albo ostatni czas.
 */
export function prefillSets({ type, target, lastSets, stepKg }: Input): PrefilledSet[] {
  const last = lastSets.filter(isCountedSet);
  const count = Math.max(1, target.targetSets ?? (last.length || DEFAULT_SET_COUNT));
  const suggestion =
    target.repsMax != null
      ? suggestNextWeight({ type, lastSets, repsMax: target.repsMax, stepKg })
      : null;
  const increase = suggestion?.reason === 'increase';

  return Array.from({ length: count }, (_, i) => {
    const previous = last[i] ?? last[last.length - 1];

    let weightKg: number | null = null;
    if (usesWeight(type)) {
      weightKg =
        increase && suggestion
          ? suggestion.weightKg
          : (previous?.weightKg ?? target.targetWeightKg ?? null);
    }

    let reps: number | null = null;
    if (usesReps(type)) {
      reps = increase
        ? (target.repsMin ?? target.repsMax ?? null)
        : (target.repsMax ?? target.repsMin ?? previous?.reps ?? null);
    }

    const durationSec = usesDuration(type)
      ? (target.targetDurationSec ?? previous?.durationSec ?? null)
      : null;

    return { kind: 'working', reps, weightKg, durationSec };
  });
}
