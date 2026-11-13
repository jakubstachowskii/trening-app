// Dane do ekranu szczegółów ćwiczenia: kafelki, historia i rekordy. Czyste funkcje.
import type { WorkoutSet } from '@/data/models';
import type { OneRepMaxFormula } from '@/domain/oneRepMax';
import { computeRecords, type HistorySet, type RecordKind } from '@/domain/records';
import { type ExerciseType, isCountedSet } from '@/domain/types';

/** Główna liczba ćwiczenia zależy od typu: 1RM dla ciężaru, powtórzenia albo czas dla reszty. */
export type HeadlineKind = 'bestOneRepMax' | 'mostReps' | 'longestDuration';

export function headlineKind(type: ExerciseType): HeadlineKind {
  if (type === 'time') return 'longestDuration';
  if (type === 'bodyweight_reps' || type === 'assisted_bodyweight') return 'mostReps';
  return 'bestOneRepMax';
}

export type TopSet = { weightKg: number | null; reps: number | null; durationSec: number | null };

/** Najlepsza robocza seria z ostatniego treningu: najdłuższa (czas) albo najcięższa, potem najwięcej powtórzeń. */
export function topSet(type: ExerciseType, sets: WorkoutSet[]): TopSet | null {
  const counted = sets.filter(isCountedSet);
  if (!counted.length) return null;
  const score = (s: WorkoutSet): [number, number] =>
    type === 'time'
      ? [s.durationSec ?? 0, 0]
      : type === 'assisted_bodyweight'
        ? // Przy odciążeniu mniej pomocy = lepiej.
          [s.reps ?? 0, -(s.weightKg ?? 0)]
        : [s.weightKg ?? 0, s.reps ?? 0];
  const best = counted.reduce((a, b) => {
    const [a1, a2] = score(a);
    const [b1, b2] = score(b);
    return b1 > a1 || (b1 === a1 && b2 > a2) ? b : a;
  });
  return { weightKg: best.weightKg, reps: best.reps, durationSec: best.durationSec };
}

export type ExerciseSummary = {
  headline: { kind: HeadlineKind; value: number | null };
  last: TopSet | null;
};

export function exerciseSummary(
  type: ExerciseType,
  history: HistorySet[],
  lastSets: WorkoutSet[],
  formula: OneRepMaxFormula = 'epley',
): ExerciseSummary {
  const records = computeRecords(type, history, formula);
  const kind = headlineKind(type);
  return {
    headline: { kind, value: records[kind]?.value ?? null },
    last: topSet(type, lastSets),
  };
}

export type HistoryWorkout = { workoutId: string; date: string; sets: HistorySet[] };

/** Historia ćwiczenia pogrupowana po treningach, najnowsze na górze, tylko serie robocze. */
export function historyByWorkout(history: HistorySet[]): HistoryWorkout[] {
  const groups = new Map<string, HistoryWorkout>();
  for (const set of history) {
    if (!isCountedSet(set)) continue;
    const group = groups.get(set.workoutId) ?? {
      workoutId: set.workoutId,
      date: set.date,
      sets: [],
    };
    group.sets.push(set);
    groups.set(set.workoutId, group);
  }
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Rekordy, które mają sens dla typu ćwiczenia (bez pustych). */
export function recordList(
  type: ExerciseType,
  history: HistorySet[],
  formula: OneRepMaxFormula = 'epley',
): { kind: RecordKind; value: number; date: string }[] {
  const records = computeRecords(type, history, formula);
  const kinds: RecordKind[] = [
    'heaviestWeight',
    'bestOneRepMax',
    'mostReps',
    'bestWorkoutVolume',
    'longestDuration',
  ];
  return kinds.flatMap((kind) => {
    const entry = records[kind];
    return entry ? [{ kind, value: entry.value, date: entry.date }] : [];
  });
}
