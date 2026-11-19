// Dane karty „Plan” (design/v2/Plan): aktywny plan z tygodniem, pozostałe plany i polecany program.
import type { Db } from '@/data/db';
import { getPlan, listPlanSummaries, type PlanSummary } from '@/data/repositories/plans';
import {
  firstFinishedForPlan,
  lastFinishedDayForPlan,
  listFinishedBetween,
} from '@/data/repositories/workouts';
import { planWeek } from '@/domain/planWeek';
import { recommendProgram, type RecommendedProgramId } from '@/domain/recommend';
import { startOfWeek } from '@/domain/stats';
import { effectiveWeeklyGoal, weekTarget } from '@/domain/week';
import { estimateDayMinutes } from '@/domain/workout';
import { loadTrainingSettings } from '@/features/settings/keys';
import { loadSession } from '@/features/workout/session';
import { summarizeSession } from '@/features/workout/summaryData';

const WEEK_MS = 7 * 24 * 3600 * 1000;

export type PlanTabRow =
  | {
      kind: 'done';
      key: string;
      name: string | null;
      date: Date;
      durationSec: number | null;
      volumeKg: number | null;
    }
  | {
      kind: 'next';
      key: string;
      dayId: string | null;
      name: string | null;
      current: boolean;
      date: Date | null;
      exerciseCount: number;
      estimateMin: number;
    };

export type PlanTabData = {
  active: {
    id: string;
    name: string;
    /** Który tydzień z planem (od tygodnia, w którym plan powstał). */
    week: number;
    target: number;
    done: number;
    trainedToday: boolean;
    rows: PlanTabRow[];
  } | null;
  others: PlanSummary[];
  /** Cel tygodnia do plakietki „Polecany”. */
  weeklyGoal: number;
  recommended: RecommendedProgramId;
};

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export async function loadPlanTab(db: Db, now: Date = new Date()): Promise<PlanTabData> {
  const settings = await loadTrainingSettings(db);
  const summaries = await listPlanSummaries(db);
  const activeSummary = summaries.find((p) => p.isActive) ?? null;
  const others = summaries.filter((p) => !p.isActive);
  const plan = activeSummary ? await getPlan(db, activeSummary.id) : null;
  const weeklyGoal = effectiveWeeklyGoal(settings.weeklyGoal, plan ? plan.days.length : null);

  if (!plan) {
    return { active: null, others, weeklyGoal, recommended: recommendProgram(weeklyGoal) };
  }

  const monday = startOfWeek(now);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const thisWeek = await listFinishedBetween(db, monday.toISOString(), nextMonday.toISOString());
  const target = weekTarget(plan.days.length, settings.weeklyGoal, plan.weekdays);
  const week = planWeek({
    dayIds: plan.days.map((d) => d.id),
    lastDoneDayId: await lastFinishedDayForPlan(db, plan.id),
    doneThisWeek: thisWeek.map((w) => ({ dayId: w.planDayId, startedAt: w.startedAt })),
    target,
    weekdays: plan.weekdays,
    now,
  });

  const rows: PlanTabRow[] = [];
  let doneIndex = 0;
  for (const [i, row] of week.entries()) {
    if (row.kind === 'done') {
      const workout = thisWeek[doneIndex];
      doneIndex += 1;
      const session = await loadSession(db, workout.id);
      const summary = session ? summarizeSession(session) : null;
      rows.push({
        kind: 'done',
        key: workout.id,
        name: workout.name,
        date: row.date,
        durationSec: summary?.durationSec ?? null,
        volumeKg: summary?.volumeKg ?? null,
      });
    } else {
      const day = plan.days.find((d) => d.id === row.dayId) ?? null;
      rows.push({
        kind: 'next',
        key: `next-${i}`,
        dayId: row.dayId,
        name: day?.name ?? null,
        current: row.current,
        date: row.date,
        exerciseCount: day?.exercises.length ?? 0,
        estimateMin: day ? estimateDayMinutes(day.exercises) : 0,
      });
    }
  }

  // Tydzień z planem liczony od pierwszego treningu z nim (kopia planu mogła powstać dawno temu).
  const first = await firstFinishedForPlan(db, plan.id);
  const since = first ? startOfWeek(new Date(first)).getTime() : monday.getTime();
  return {
    active: {
      id: plan.id,
      name: plan.name,
      week: Math.max(1, Math.round((monday.getTime() - since) / WEEK_MS) + 1),
      target,
      done: thisWeek.length,
      trainedToday: thisWeek.some((w) => sameDay(new Date(w.startedAt), now)),
      rows,
    },
    others,
    weeklyGoal,
    recommended: recommendProgram(weeklyGoal),
  };
}
