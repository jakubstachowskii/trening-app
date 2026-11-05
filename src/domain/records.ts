// Rekordy liczone z historii serii jednego ćwiczenia (nie są zapisywane w bazie, docs/PLAN.md §4).
import { estimateOneRepMax, type OneRepMaxFormula } from './oneRepMax';
import { type ExerciseType, isCountedSet, type LoggedSet } from './types';
import { effectiveLoadKg, setVolumeKg } from './volume';

export type HistorySet = LoggedSet & {
  workoutId: string;
  /** Data rozpoczęcia treningu (ISO 8601). */
  date: string;
  bodyweightKg?: number | null;
};

export type RecordEntry = {
  value: number;
  workoutId: string;
  date: string;
  reps?: number | null;
  weightKg?: number | null;
};

export type RepsAtWeight = { weightKg: number; reps: number; workoutId: string; date: string };

export type PersonalRecords = {
  heaviestWeight: RecordEntry | null;
  bestOneRepMax: RecordEntry | null;
  mostReps: RecordEntry | null;
  bestWorkoutVolume: RecordEntry | null;
  longestDuration: RecordEntry | null;
  repsAtWeight: RepsAtWeight[];
};

export type RecordKind = Exclude<keyof PersonalRecords, 'repsAtWeight'>;

const RECORD_KINDS: RecordKind[] = [
  'heaviestWeight',
  'bestOneRepMax',
  'mostReps',
  'bestWorkoutVolume',
  'longestDuration',
];

const HAS_WEIGHT: ExerciseType[] = ['weight_reps', 'weighted_bodyweight'];
const HAS_REPS: ExerciseType[] = [
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
];

/** Przy remisie wygrywa wcześniejszy wpis: nowy musi być ściśle lepszy. */
function better(current: RecordEntry | null, candidate: RecordEntry): RecordEntry {
  return current == null || candidate.value > current.value ? candidate : current;
}

function byDate(sets: HistorySet[]): HistorySet[] {
  return [...sets].sort((a, b) => a.date.localeCompare(b.date));
}

export function computeRecords(
  type: ExerciseType,
  history: HistorySet[],
  formula: OneRepMaxFormula = 'epley',
): PersonalRecords {
  const records: PersonalRecords = {
    heaviestWeight: null,
    bestOneRepMax: null,
    mostReps: null,
    bestWorkoutVolume: null,
    longestDuration: null,
    repsAtWeight: [],
  };
  const volumeByWorkout = new Map<string, RecordEntry>();
  const repsAtWeight = new Map<number, RepsAtWeight>();

  for (const set of byDate(history).filter(isCountedSet)) {
    const at = { workoutId: set.workoutId, date: set.date, reps: set.reps, weightKg: set.weightKg };

    if (HAS_WEIGHT.includes(type) && set.weightKg != null && set.weightKg > 0) {
      records.heaviestWeight = better(records.heaviestWeight, { ...at, value: set.weightKg });

      const load = effectiveLoadKg(type, set.weightKg, set.bodyweightKg);
      const oneRm = load != null && set.reps ? estimateOneRepMax(load, set.reps, formula) : null;
      if (oneRm != null)
        records.bestOneRepMax = better(records.bestOneRepMax, { ...at, value: oneRm });

      if (set.reps) {
        const known = repsAtWeight.get(set.weightKg);
        if (!known || set.reps > known.reps) {
          repsAtWeight.set(set.weightKg, {
            weightKg: set.weightKg,
            reps: set.reps,
            workoutId: set.workoutId,
            date: set.date,
          });
        }
      }
    }

    if (HAS_REPS.includes(type) && set.reps) {
      records.mostReps = better(records.mostReps, { ...at, value: set.reps });
    }

    if (type === 'time' && set.durationSec) {
      records.longestDuration = better(records.longestDuration, { ...at, value: set.durationSec });
    }

    const volume = setVolumeKg(type, set, set.bodyweightKg);
    if (volume > 0) {
      const sum = volumeByWorkout.get(set.workoutId);
      volumeByWorkout.set(set.workoutId, {
        workoutId: set.workoutId,
        date: set.date,
        value: (sum?.value ?? 0) + volume,
      });
    }
  }

  for (const entry of volumeByWorkout.values()) {
    records.bestWorkoutVolume = better(records.bestWorkoutVolume, entry);
  }
  records.repsAtWeight = [...repsAtWeight.values()].sort((a, b) => a.weightKg - b.weightKg);
  return records;
}

/**
 * Rekordy pobite w danym treningu w porównaniu z wcześniejszymi treningami.
 * Pierwszy trening z ćwiczeniem nie daje „rekordów” — nie ma z czym porównać.
 */
export function newRecordsInWorkout(
  type: ExerciseType,
  history: HistorySet[],
  workoutId: string,
  formula: OneRepMaxFormula = 'epley',
): RecordKind[] {
  const workoutDate = history.find((set) => set.workoutId === workoutId)?.date;
  if (!workoutDate) return [];
  const earlier = history.filter((set) => set.workoutId !== workoutId && set.date < workoutDate);
  if (!earlier.some(isCountedSet)) return [];

  const before = computeRecords(type, earlier, formula);
  const after = computeRecords(
    type,
    [...earlier, ...history.filter((s) => s.workoutId === workoutId)],
    formula,
  );

  return RECORD_KINDS.filter((kind) => {
    const next = after[kind];
    return next != null && next.workoutId === workoutId && (before[kind]?.value ?? -1) < next.value;
  });
}
