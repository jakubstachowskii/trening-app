// Domyślne parametry ćwiczenia dodanego do planu (użytkownik zmienia je w arkuszu „Serie i powtórzenia”).
import type { PlanExerciseInput } from '@/data/repositories/plans';
import type { ExerciseType } from '@/domain/types';

export const DEFAULT_SETS = 3;
export const DEFAULT_REPS: [number, number] = [8, 12];
export const DEFAULT_DURATION_SEC = 30;
export const DEFAULT_REST_SEC = 90;

export function defaultPlanExercise(
  exerciseId: string,
  type: ExerciseType,
  restSec: number = DEFAULT_REST_SEC,
): PlanExerciseInput {
  const timed = type === 'time';
  return {
    exerciseId,
    targetSets: DEFAULT_SETS,
    repsMin: timed ? null : DEFAULT_REPS[0],
    repsMax: timed ? null : DEFAULT_REPS[1],
    targetWeightKg: null,
    targetDurationSec: timed ? DEFAULT_DURATION_SEC : null,
    restSec,
    note: null,
  };
}
