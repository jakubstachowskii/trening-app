// Typy wspólne dla logiki domenowej. Ciężar w kg, czas w sekundach, daty w ISO 8601 (UTC).

export type ExerciseType =
  'weight_reps' | 'bodyweight_reps' | 'weighted_bodyweight' | 'assisted_bodyweight' | 'time';

export type SetKind = 'warmup' | 'working';

export type LoggedSet = {
  kind: SetKind;
  reps?: number | null;
  /** Ciężar sztangi, obciążnik albo pomoc gumy, zależnie od typu ćwiczenia. */
  weightKg?: number | null;
  durationSec?: number | null;
  completedAt?: string | null;
};

/** Seria liczona do statystyk: ukończona i robocza. */
export function isCountedSet(set: LoggedSet): boolean {
  return set.kind === 'working' && Boolean(set.completedAt);
}
