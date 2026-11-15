// Dane podsumowania zakończonego treningu: liczby i nowe rekordy.
import type { Db } from '@/data/db';
import { exerciseHistory } from '@/data/repositories/workouts';
import { newRecordsInWorkout, type RecordKind } from '@/domain/records';
import { summarizeWorkout, type WorkoutSummary } from '@/domain/workout';

import { loadSession, type Session } from './session';

export type SummaryRecord = { exerciseName: string; kinds: RecordKind[] };
export type SummaryData = { session: Session; summary: WorkoutSummary; records: SummaryRecord[] };

export async function loadSummary(db: Db, workoutId: string): Promise<SummaryData | null> {
  const session = await loadSession(db, workoutId);
  if (!session?.finishedAt) return null;
  const summary = summarizeWorkout({
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    bodyweightKg: session.bodyweightKg,
    exercises: session.exercises.map((e) => ({ type: e.exercise.type, sets: e.sets })),
  });
  const records: SummaryRecord[] = [];
  const seen = new Set<string>();
  for (const e of session.exercises) {
    if (seen.has(e.exerciseId)) continue;
    seen.add(e.exerciseId);
    const kinds = newRecordsInWorkout(
      e.exercise.type,
      await exerciseHistory(db, e.exerciseId),
      session.id,
    );
    if (kinds.length) records.push({ exerciseName: e.name, kinds });
  }
  return { session, summary, records };
}
