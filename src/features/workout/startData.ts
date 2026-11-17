// Dane ekranu „Dziś”: trening w toku, następny dzień planu, pierścień tygodnia, seria i ostatni rekord.
import type { Db } from '@/data/db';
import type { PlanDay, Workout } from '@/data/models';
import { getPlan, listPlans } from '@/data/repositories/plans';
import { getSetting } from '@/data/repositories/settings';
import {
  exerciseHistory,
  getUnfinishedWorkout,
  lastFinishedDayForPlan,
  listFinishedStarts,
  listWorkouts,
} from '@/data/repositories/workouts';
import { computeRecords, newRecordsInWorkout } from '@/domain/records';
import {
  clampWeeklyGoal,
  isRestDay,
  nextTrainingDate,
  type WeekDay,
  weekDays,
  weekDoneCount,
  weekStreak,
  weekTarget,
  WEEKLY_GOAL_DEFAULT,
} from '@/domain/week';
import { estimateDayMinutes, formatClock, nextPlanDayId } from '@/domain/workout';
import { formatNumber, t } from '@/i18n';

import { loadSession } from './session';
import { summarizeSession, WEEKLY_GOAL_SETTING } from './summaryData';

export { WEEKLY_GOAL_SETTING };
/** Ile ostatnich treningów przeszukujemy, szukając ostatniego rekordu. */
const RECORD_LOOKBACK = 20;

export type LastRecord = { exerciseName: string; value: string; date: string };

export type StartData = {
  unfinished: Workout | null;
  plan: { id: string; name: string } | null;
  nextDay: PlanDay | null;
  /** Szacowany czas następnego dnia planu w minutach (0 = pusty dzień). */
  estimateMin: number;
  weeklyGoal: number;
  /** Segmenty pierścienia: dni planu albo cel tygodnia. */
  target: number;
  done: number;
  days: WeekDay[];
  streak: number;
  /** Plan ma wybrane dni, a dziś do nich nie należy. */
  restDay: boolean;
  /** Najbliższy dzień treningowy (ISO), gdy plan ma wybrane dni. */
  nextTraining: string | null;
  /** Ostatni trening zakończony dziś (stan „Zrobione”). */
  todayFinished: { id: string; name: string | null; durationSec: number; volumeKg: number } | null;
  lastRecord: LastRecord | null;
};

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Najnowszy rekord z ostatnich treningów: ćwiczenie, wynik („120 kg × 5”) i data. */
async function loadLastRecord(db: Db): Promise<LastRecord | null> {
  for (const workout of await listWorkouts(db, { limit: RECORD_LOOKBACK })) {
    const session = await loadSession(db, workout.id);
    if (!session) continue;
    for (const e of session.exercises) {
      const history = await exerciseHistory(db, e.exerciseId);
      const kinds = newRecordsInWorkout(e.exercise.type, history, workout.id);
      if (!kinds.length) continue;
      // Wynik z chwili tego treningu (późniejsze treningi mogły go już poprawić).
      const until = Date.parse(workout.startedAt);
      const records = computeRecords(
        e.exercise.type,
        history.filter((x) => Date.parse(x.date) <= until),
      );
      const entry = records[kinds[0]];
      if (!entry) continue;
      const value =
        kinds[0] === 'longestDuration'
          ? formatClock(entry.value)
          : entry.weightKg != null && entry.reps != null
            ? t('workout.setDetailWeight', {
                weight: formatNumber(entry.weightKg),
                reps: entry.reps,
              })
            : entry.reps != null
              ? `× ${entry.reps}`
              : formatNumber(entry.value);
      return { exerciseName: e.name, value, date: workout.startedAt };
    }
  }
  return null;
}

export async function loadStartData(db: Db, now: Date = new Date()): Promise<StartData> {
  const unfinished = await getUnfinishedWorkout(db);
  const weeklyGoal = clampWeeklyGoal(
    await getSetting<number>(db, WEEKLY_GOAL_SETTING, WEEKLY_GOAL_DEFAULT),
  );
  const active = (await listPlans(db)).find((p) => p.isActive);
  const plan = active ? await getPlan(db, active.id) : null;
  const planDays = plan?.days ?? [];
  const nextId = active
    ? nextPlanDayId(
        planDays.map((d) => d.id),
        await lastFinishedDayForPlan(db, active.id),
      )
    : null;
  const nextDay = planDays.find((d) => d.id === nextId) ?? null;

  const starts = await listFinishedStarts(db);
  const weekdays = plan?.weekdays ?? null;
  const target = weekTarget(active ? planDays.length : null, weeklyGoal, weekdays);

  const [latest] = await listWorkouts(db, { limit: 1 });
  let todayFinished: StartData['todayFinished'] = null;
  if (latest && sameDay(new Date(latest.startedAt), now)) {
    const session = await loadSession(db, latest.id);
    const summary = session ? summarizeSession(session) : null;
    if (summary) {
      todayFinished = {
        id: latest.id,
        name: latest.name,
        durationSec: summary.durationSec,
        volumeKg: summary.volumeKg,
      };
    }
  }

  return {
    unfinished,
    plan: active ? { id: active.id, name: active.name } : null,
    nextDay,
    estimateMin: nextDay ? estimateDayMinutes(nextDay.exercises) : 0,
    weeklyGoal,
    target,
    done: weekDoneCount(starts, now),
    days: weekDays(starts, now, weekdays),
    streak: weekStreak(starts, target, now),
    restDay: isRestDay(weekdays, now),
    nextTraining: nextTrainingDate(weekdays, now)?.toISOString() ?? null,
    todayFinished,
    lastRecord: await loadLastRecord(db),
  };
}
