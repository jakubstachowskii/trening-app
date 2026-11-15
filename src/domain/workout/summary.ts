// Podsumowanie zakończonego treningu.
import { type ExerciseType, isCountedSet, type LoggedSet } from '../types';
import { workoutVolumeKg } from '../volume';

export type SummaryInput = {
  startedAt: string;
  finishedAt: string;
  bodyweightKg?: number | null;
  exercises: { type: ExerciseType; sets: LoggedSet[] }[];
};

export type WorkoutSummary = {
  durationSec: number;
  volumeKg: number;
  /** Ukończone serie robocze. */
  setCount: number;
  exerciseCount: number;
};

export function summarizeWorkout(input: SummaryInput): WorkoutSummary {
  const durationMs = Date.parse(input.finishedAt) - Date.parse(input.startedAt);
  return {
    durationSec: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs / 1000)) : 0,
    volumeKg: workoutVolumeKg(input.exercises, input.bodyweightKg),
    setCount: input.exercises.reduce((n, e) => n + e.sets.filter(isCountedSet).length, 0),
    exerciseCount: input.exercises.filter((e) => e.sets.some(isCountedSet)).length,
  };
}

/** Czas od startu w sekundach (licznik w nagłówku). */
export function elapsedSec(startedAt: string, now: number): number {
  const start = Date.parse(startedAt);
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
}

/** 32:14 albo 1:05:09. */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
