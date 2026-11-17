// Rekord pobity w trakcie treningu, w chwili odhaczenia serii (komunikat „Nowy rekord”).
import { computeRecords, type HistorySet, type RecordKind } from '../records';
import { type ExerciseType, isCountedSet, type LoggedSet } from '../types';

/** Objętość treningu rośnie z każdą serią, więc ten rekord pokazujemy dopiero w podsumowaniu. */
const LIVE_KINDS: RecordKind[] = ['heaviestWeight', 'bestOneRepMax', 'mostReps', 'longestDuration'];

type Input = {
  type: ExerciseType;
  /** Serie z wcześniejszych, zakończonych treningów. */
  history: HistorySet[];
  /** Serie tego ćwiczenia odhaczone wcześniej w bieżącym treningu (bez właśnie odhaczonej). */
  doneBefore: LoggedSet[];
  justDone: LoggedSet;
  workoutId: string;
  startedAt: string;
  bodyweightKg?: number | null;
};

export function recordsBrokenBySet(input: Input): RecordKind[] {
  if (!isCountedSet(input.justDone) || !input.history.some(isCountedSet)) return [];
  const asHistory = (set: LoggedSet): HistorySet => ({
    ...set,
    workoutId: input.workoutId,
    date: input.startedAt,
    bodyweightKg: input.bodyweightKg,
  });
  const base = [...input.history, ...input.doneBefore.map(asHistory)];
  const before = computeRecords(input.type, base);
  const after = computeRecords(input.type, [...base, asHistory(input.justDone)]);
  return LIVE_KINDS.filter((kind) => {
    const next = after[kind];
    return next != null && (before[kind]?.value ?? -1) < next.value;
  });
}
