// Dane karty Start: trening w toku albo następny dzień aktywnego planu.
import type { Db } from '@/data/db';
import type { PlanDay, Workout } from '@/data/models';
import { getPlan, listPlans } from '@/data/repositories/plans';
import { getUnfinishedWorkout, lastFinishedDayForPlan } from '@/data/repositories/workouts';
import { nextPlanDayId } from '@/domain/workout';

export type StartData = {
  unfinished: Workout | null;
  plan: { id: string; name: string } | null;
  nextDay: PlanDay | null;
};

export async function loadStartData(db: Db): Promise<StartData> {
  const unfinished = await getUnfinishedWorkout(db);
  const active = (await listPlans(db)).find((p) => p.isActive);
  if (!active) return { unfinished, plan: null, nextDay: null };
  const plan = await getPlan(db, active.id);
  const days = plan?.days ?? [];
  const nextId = nextPlanDayId(
    days.map((d) => d.id),
    await lastFinishedDayForPlan(db, active.id),
  );
  return {
    unfinished,
    plan: { id: active.id, name: active.name },
    nextDay: days.find((d) => d.id === nextId) ?? null,
  };
}
