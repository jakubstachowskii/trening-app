// Sprawdzenie parametrów ćwiczenia w planie przed zapisem (baza i tak pilnuje zakresu powtórzeń).
import type { MessageKey } from '@/i18n';

type Target = { repsMin: number | null; repsMax: number | null };

/** Klucz komunikatu błędu albo null, gdy wszystko w porządku. */
export function validatePlanTarget(target: Target): MessageKey | null {
  if (target.repsMin != null && target.repsMax != null && target.repsMin > target.repsMax) {
    return 'planExercise.repsOrder';
  }
  return null;
}
