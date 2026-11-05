// Podpowiedź ciężaru na następny trening: prosta progresja podwójna (docs/PLAN.md §5).
import { type ExerciseType, isCountedSet, type LoggedSet } from './types';
import { roundWeight } from './units';

export const DEFAULT_WEIGHT_STEP_KG = 2.5;

const WEIGHTED_TYPES: ExerciseType[] = ['weight_reps', 'weighted_bodyweight'];

export type WeightSuggestion = { weightKg: number; reason: 'increase' | 'same' };

type Input = {
  type: ExerciseType;
  /** Serie tego ćwiczenia z ostatniego treningu. */
  lastSets: LoggedSet[];
  /** Górny zakres powtórzeń z planu. */
  repsMax: number;
  stepKg?: number;
};

export function suggestNextWeight({
  type,
  lastSets,
  repsMax,
  stepKg = DEFAULT_WEIGHT_STEP_KG,
}: Input): WeightSuggestion | null {
  if (!WEIGHTED_TYPES.includes(type)) return null;

  const sets = lastSets.filter(isCountedSet);
  if (sets.length === 0 || sets.some((set) => set.weightKg == null)) return null;

  const topWeight = Math.max(...sets.map((set) => set.weightKg ?? 0));
  const allAtTop = sets.every((set) => (set.reps ?? 0) >= repsMax);

  return allAtTop
    ? { weightKg: roundWeight(topWeight + stepKg), reason: 'increase' }
    : { weightKg: topWeight, reason: 'same' };
}
