// Dane karty „Postępy” (design/v2/Postepy): Regularność z 12 tygodni i historia miesiąca.
import type { Db } from '@/data/db';
import { getPlan, listPlans } from '@/data/repositories/plans';
import {
  exerciseHistory,
  listFinishedBetween,
  listFinishedStarts,
} from '@/data/repositories/workouts';
import { type HistorySet, newRecordsInWorkout } from '@/domain/records';
import { type WeekCount, weeklyHistory, weekStreak, weekTarget } from '@/domain/week';
import { loadTrainingSettings } from '@/features/settings/keys';
import { loadSession } from '@/features/workout/session';
import { summarizeSession } from '@/features/workout/summaryData';

export type Overview = {
  empty: boolean;
  target: number;
  weeks: WeekCount[];
  streak: number;
};

export async function loadOverview(db: Db, now: Date = new Date()): Promise<Overview> {
  const starts = await listFinishedStarts(db);
  const settings = await loadTrainingSettings(db);
  const active = (await listPlans(db)).find((p) => p.isActive);
  const plan = active ? await getPlan(db, active.id) : null;
  const target = weekTarget(plan ? plan.days.length : null, settings.weeklyGoal, plan?.weekdays);
  return {
    empty: starts.length === 0,
    target,
    weeks: weeklyHistory(starts, now),
    streak: weekStreak(starts, target, now),
  };
}

export type HistoryItem = {
  id: string;
  name: string | null;
  startedAt: string;
  durationSec: number | null;
  volumeKg: number | null;
  records: number;
};

export type MonthHistory = {
  year: number;
  month: number;
  items: HistoryItem[];
  anyBefore: boolean;
};

/** Zakończone treningi miesiąca od najnowszych, z liczbą rekordów (liczone tylko dla tego miesiąca). */
export async function loadMonth(db: Db, year: number, month: number): Promise<MonthHistory> {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  const workouts = await listFinishedBetween(db, from.toISOString(), to.toISOString());
  const histories = new Map<string, HistorySet[]>();
  const items: HistoryItem[] = [];
  for (const w of workouts) {
    const session = await loadSession(db, w.id);
    const summary = session ? summarizeSession(session) : null;
    let records = 0;
    for (const e of session?.exercises ?? []) {
      let history = histories.get(e.exerciseId);
      if (!history) {
        history = await exerciseHistory(db, e.exerciseId);
        histories.set(e.exerciseId, history);
      }
      if (newRecordsInWorkout(e.exercise.type, history, w.id).length) records += 1;
    }
    items.push({
      id: w.id,
      name: w.name,
      startedAt: w.startedAt,
      durationSec: summary?.durationSec ?? null,
      volumeKg: summary?.volumeKg ?? null,
      records,
    });
  }
  const starts = await listFinishedStarts(db);
  return {
    year,
    month,
    items: items.reverse(),
    anyBefore: starts.some((s) => new Date(s) < from),
  };
}
