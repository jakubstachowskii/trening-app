// Dane ekranu treningu: trening w toku z nazwami, typami ćwiczeń i seriami z poprzedniego razu.
import type { Db } from '@/data/db';
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/data/models';
import { getExercise } from '@/data/repositories/exercises';
import {
  getUnfinishedWorkout,
  getWorkout,
  lastSetsForExercise,
} from '@/data/repositories/workouts';
import type { ExerciseType } from '@/domain/types';
import { suggestNextWeight } from '@/domain/suggestion';
import { formatClock, usesDuration, usesReps, usesWeight } from '@/domain/workout';
import { formatNumber, t, tPlural } from '@/i18n';
import { exerciseName } from '@/features/exercises/search';
import { formatDuration, formatRepRange } from '@/features/plans/format';

export type SessionExercise = WorkoutExercise & {
  exercise: Exercise;
  name: string;
  /** Serie z ostatniego zakończonego treningu (kolumna „Poprzednio”). */
  previous: WorkoutSet[];
};

export type Session = Workout & { exercises: SessionExercise[] };

export async function loadSession(db: Db, workoutId?: string): Promise<Session | null> {
  const id = workoutId ?? (await getUnfinishedWorkout(db))?.id;
  if (!id) return null;
  const workout = await getWorkout(db, id);
  if (!workout) return null;
  const exercises: SessionExercise[] = [];
  for (const we of workout.exercises) {
    const exercise = await getExercise(db, we.exerciseId);
    if (!exercise) continue;
    exercises.push({
      ...we,
      exercise,
      name: exerciseName(exercise),
      previous: await lastSetsForExercise(db, we.exerciseId),
    });
  }
  return { ...workout, exercises };
}

/** „82,5 × 8”, „× 12”, „0:45” — krótko, do kolumny „Poprzednio” i podpowiedzi. */
export function formatSetValues(type: ExerciseType, set: Partial<WorkoutSet> | undefined): string {
  if (!set) return '—';
  if (usesDuration(type)) return set.durationSec != null ? formatClock(set.durationSec) : '—';
  const reps = set.reps != null ? String(set.reps) : '—';
  if (!usesWeight(type)) return `× ${reps}`;
  const weight = set.weightKg != null ? formatNumber(set.weightKg) : '—';
  return `${weight} × ${reps}`;
}

/** „82,5 kg × 8”, „12 powtórzeń”, „1:30” — druga linia głównego przycisku i podpowiedź. */
export function formatSetDetail(type: ExerciseType, set: Partial<WorkoutSet> | undefined): string {
  if (!set) return '';
  if (usesDuration(type)) return set.durationSec != null ? formatClock(set.durationSec) : '';
  // Bez wpisanego ciężaru (np. pierwszy raz) sam ciężar pomijamy zamiast „— kg”.
  if (set.reps == null) return '';
  if (!usesWeight(type) || set.weightKg == null) return tPlural('units.reps', set.reps);
  return t('workout.setDetailWeight', { weight: formatNumber(set.weightKg), reps: set.reps });
}

/** Podpowiedź nad tabelą z prostej progresji (tylko gdy jest historia i zakres powtórzeń). */
export function progressionHint(item: SessionExercise): string | null {
  if (item.repsMax == null) return null;
  const suggestion = suggestNextWeight({
    type: item.exercise.type,
    lastSets: item.previous,
    repsMax: item.repsMax,
  });
  if (!suggestion) return null;
  const weight = formatNumber(suggestion.weightKg);
  const lastWorking = item.previous.find((x) => x.kind === 'working');
  return suggestion.reason === 'increase'
    ? t('workout.hintIncrease', {
        weight,
        previous: formatSetDetail(item.exercise.type, lastWorking),
      })
    : t('workout.hintSame', { weight, reps: item.repsMax });
}

/** „3 serie · 8–10” w liście „Następne”. */
export function exerciseMeta(item: SessionExercise): string {
  const sets = tPlural('units.sets', item.sets.length);
  const target = usesDuration(item.exercise.type)
    ? item.targetDurationSec != null
      ? formatDuration(item.targetDurationSec)
      : ''
    : usesReps(item.exercise.type)
      ? formatRepRange(item.repsMin, item.repsMax)
      : '';
  const first = item.sets[0];
  const values = target || (first ? formatSetValues(item.exercise.type, first) : '');
  return values ? t('workout.nextMeta', { sets, target: values }) : sets;
}

export function setLabel(set: WorkoutSet, workingIndex: number): string {
  return set.kind === 'warmup' ? t('workout.warmupShort') : String(workingIndex);
}

/** Numer serii roboczej (rozgrzewka nie zwiększa licznika). */
export function workingNumbers(sets: WorkoutSet[]): number[] {
  let n = 0;
  return sets.map((set) => (set.kind === 'working' ? ++n : n));
}
