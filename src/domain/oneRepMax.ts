// Szacowane maksimum na jedno powtórzenie (1RM). Wzór wybiera użytkownik w ustawieniach.

export type OneRepMaxFormula = 'epley' | 'brzycki';

/** Powyżej tylu powtórzeń oba wzory są mało dokładne — interfejs oznacza wynik jako orientacyjny. */
export const RELIABLE_REPS_MAX = 12;

/** Wzór Brzyckiego dzieli przez (37 − powtórzenia). */
const BRZYCKI_REPS_LIMIT = 37;

export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  formula: OneRepMaxFormula = 'epley',
): number | null {
  const fullReps = Math.floor(reps);
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(fullReps) || fullReps < 1) {
    return null;
  }
  if (fullReps === 1) return weightKg;

  if (formula === 'brzycki') {
    if (fullReps >= BRZYCKI_REPS_LIMIT) return null;
    return (weightKg * 36) / (BRZYCKI_REPS_LIMIT - fullReps);
  }
  return weightKg * (1 + fullReps / 30);
}

export function isReliableEstimate(reps: number): boolean {
  return reps <= RELIABLE_REPS_MAX;
}
