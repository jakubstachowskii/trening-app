// Gdzie jestem w treningu: następna seria, następne ćwiczenie, co robi główny przycisk.
import type { LoggedSet } from '../types';

type ExerciseLike = { sets: Pick<LoggedSet, 'completedAt'>[] };

export const isDone = (set: Pick<LoggedSet, 'completedAt'>): boolean => Boolean(set.completedAt);

/** Indeks pierwszej nieodhaczonej serii albo -1. */
export function nextPendingSetIndex(exercise: ExerciseLike): number {
  return exercise.sets.findIndex((set) => !isDone(set));
}

export const completedCount = (exercise: ExerciseLike): number =>
  exercise.sets.filter(isDone).length;

/** Następne ćwiczenie z nieodhaczonymi seriami: najpierw dalej na liście, potem od początku. */
export function nextExerciseIndex(exercises: ExerciseLike[], current: number): number {
  const n = exercises.length;
  for (let step = 1; step < n; step++) {
    const index = (current + step) % n;
    if (nextPendingSetIndex(exercises[index]) !== -1) return index;
  }
  return -1;
}

/** Ćwiczenie, od którego zaczyna się po otwarciu (albo wznowieniu) treningu. */
export function initialExerciseIndex(exercises: ExerciseLike[]): number {
  const index = exercises.findIndex((e) => nextPendingSetIndex(e) !== -1);
  return index === -1 ? Math.max(0, exercises.length - 1) : index;
}

export type PrimaryAction =
  | { kind: 'complete'; setIndex: number }
  | { kind: 'nextExercise'; exerciseIndex: number }
  | { kind: 'finish' };

/** Pływający przycisk: „Odhacz serię N” → „Następne ćwiczenie” → „Zakończ trening”. */
export function primaryAction(exercises: ExerciseLike[], current: number): PrimaryAction {
  const exercise = exercises[current];
  if (exercise) {
    const setIndex = nextPendingSetIndex(exercise);
    if (setIndex !== -1) return { kind: 'complete', setIndex };
  }
  const next = nextExerciseIndex(exercises, current);
  return next === -1 ? { kind: 'finish' } : { kind: 'nextExercise', exerciseIndex: next };
}

export function hasPendingSets(exercises: ExerciseLike[]): boolean {
  return exercises.some((e) => nextPendingSetIndex(e) !== -1);
}

/** Kolejny dzień planu po ostatnio zrobionym (z zawijaniem). Bez historii: pierwszy dzień. */
export function nextPlanDayId(
  dayIds: readonly string[],
  lastDoneDayId: string | null | undefined,
): string | null {
  if (dayIds.length === 0) return null;
  const index = lastDoneDayId ? dayIds.indexOf(lastDoneDayId) : -1;
  return index === -1 ? dayIds[0] : dayIds[(index + 1) % dayIds.length];
}

/**
 * Po wpisaniu wartości w serii: kolejne nieodhaczone serie, które miały tę samą starą wartość
 * (albo były puste), dostają nową — żeby nie wpisywać ciężaru w każdej serii osobno.
 */
export function followingSetsToUpdate<S extends { id: string; completedAt?: string | null }>(
  sets: S[],
  setId: string,
  read: (set: S) => number | null | undefined,
  oldValue: number | null | undefined,
): string[] {
  const start = sets.findIndex((s) => s.id === setId);
  if (start === -1) return [];
  return sets
    .slice(start + 1)
    .filter((s) => !s.completedAt && (read(s) ?? null) === (oldValue ?? null))
    .map((s) => s.id);
}
