// Dane podsumowania zakończonego treningu: liczby, nowe rekordy, tydzień i porównanie z poprzednim.
import type { Db } from '@/data/db';
import { listPlans, getPlan } from '@/data/repositories/plans';
import { getSetting } from '@/data/repositories/settings';
import {
  exerciseHistory,
  listFinishedStarts,
  previousFinishedForDay,
} from '@/data/repositories/workouts';
import { newRecordsInWorkout, type RecordKind } from '@/domain/records';
import { clampWeeklyGoal, weekDoneCount, weekTarget, WEEKLY_GOAL_DEFAULT } from '@/domain/week';
import { summarizeWorkout, type WorkoutSummary } from '@/domain/workout';

import { loadSession, type Session } from './session';

/** Klucz ustawienia: cel treningów na tydzień, gdy nie ma aktywnego planu. */
export const WEEKLY_GOAL_SETTING = 'weeklyGoal';

export type SummaryRecord = { exerciseName: string; kinds: RecordKind[] };
export type SummaryData = {
  session: Session;
  summary: WorkoutSummary;
  records: SummaryRecord[];
  /** Który to trening w tygodniu i ile segmentów ma pierścień. */
  week: { done: number; target: number };
  /** Objętość poprzedniego takiego samego dnia planu (null = brak porównania). */
  previousVolumeKg: number | null;
};

/** Liczby zakończonego treningu (null, gdy trening trwa). */
export function summarizeSession(session: Session): WorkoutSummary | null {
  if (!session.finishedAt) return null;
  return summarizeWorkout({
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    bodyweightKg: session.bodyweightKg,
    exercises: session.exercises.map((e) => ({ type: e.exercise.type, sets: e.sets })),
  });
}

export async function loadSummary(db: Db, workoutId: string): Promise<SummaryData | null> {
  const session = await loadSession(db, workoutId);
  const summary = session ? summarizeSession(session) : null;
  if (!session || !summary) return null;

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

  // Tydzień liczony względem dnia treningu (podsumowanie można otworzyć później).
  const when = new Date(session.startedAt);
  const active = (await listPlans(db)).find((p) => p.isActive);
  const activePlan = active ? await getPlan(db, active.id) : null;
  const planDays = active ? (activePlan?.days.length ?? 0) : null;
  const goal = clampWeeklyGoal(
    await getSetting<number>(db, WEEKLY_GOAL_SETTING, WEEKLY_GOAL_DEFAULT),
  );
  const until = Date.parse(session.startedAt);
  const starts = (await listFinishedStarts(db)).filter((s) => Date.parse(s) <= until);

  let previousVolumeKg: number | null = null;
  if (session.planDayId) {
    const previous = await previousFinishedForDay(db, session.planDayId, session.startedAt);
    const prevSession = previous ? await loadSession(db, previous.id) : null;
    previousVolumeKg = prevSession ? (summarizeSession(prevSession)?.volumeKg ?? null) : null;
  }

  return {
    session,
    summary,
    records,
    week: {
      done: weekDoneCount(starts, when),
      target: weekTarget(planDays, goal, activePlan?.weekdays ?? null),
    },
    previousVolumeKg,
  };
}
