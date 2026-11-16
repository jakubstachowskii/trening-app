// Tydzień na ekranie „Dziś”: cel (segmenty pierścienia), zrobione treningi, dni i seria tygodni.
// Tydzień od poniedziałku w lokalnej strefie czasu (jak w stats.ts).
import { startOfWeek } from './stats';

const DAYS_IN_WEEK = 7;
export const WEEKLY_GOAL_MIN = 2;
export const WEEKLY_GOAL_MAX = 6;
export const WEEKLY_GOAL_DEFAULT = 3;
/** Ile tygodni wstecz liczymy serię (dłuższej nikt nie zobaczy, a pętla ma koniec). */
const STREAK_MAX_WEEKS = 520;

export function clampWeeklyGoal(goal: number): number {
  if (!Number.isFinite(goal)) return WEEKLY_GOAL_DEFAULT;
  return Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, Math.round(goal)));
}

/**
 * Ile treningów na tydzień: z aktywnym planem tyle, ile ma dni (plan to rotacja dni, bez dni tygodnia),
 * bez planu cel ustawiony przez użytkownika.
 */
export function weekTarget(planDayCount: number | null, weeklyGoal: number): number {
  if (planDayCount != null && planDayCount > 0) return Math.min(DAYS_IN_WEEK, planDayCount);
  return clampWeeklyGoal(weeklyGoal);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekIndex(date: Date, thisWeek: Date): number {
  // Zaokrąglenie chroni przed zmianą czasu (tydzień ma wtedy 167 albo 169 godzin).
  const ms = startOfWeek(date).getTime() - thisWeek.getTime();
  return Math.round(ms / (DAYS_IN_WEEK * 24 * 3600 * 1000));
}

/** Liczba zakończonych treningów w bieżącym tygodniu. */
export function weekDoneCount(startedAt: string[], now: Date): number {
  const thisWeek = startOfWeek(now);
  return startedAt.filter((s) => weekIndex(new Date(s), thisWeek) === 0).length;
}

export type WeekDay = { date: Date; done: boolean; today: boolean };

/** Poniedziałek–niedziela bieżącego tygodnia: czy był trening i czy to dziś. */
export function weekDays(startedAt: string[], now: Date): WeekDay[] {
  const monday = startOfWeek(now);
  const doneDays = new Set(
    startedAt.map((s) => {
      const d = new Date(s);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
    const date = addDays(monday, i);
    return { date, done: doneDays.has(date.getTime()), today: date.getTime() === today };
  });
}

/**
 * Seria: kolejne tygodnie (wstecz od poprzedniego) z co najmniej `target` treningami.
 * Bieżący tydzień dolicza się dopiero, gdy cel jest już osiągnięty — niedokończony tydzień serii nie przerywa.
 */
export function weekStreak(startedAt: string[], target: number, now: Date): number {
  if (target <= 0) return 0;
  const thisWeek = startOfWeek(now);
  const counts = new Map<number, number>();
  for (const s of startedAt) {
    const i = weekIndex(new Date(s), thisWeek);
    if (i <= 0) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  let streak = (counts.get(0) ?? 0) >= target ? 1 : 0;
  for (let i = -1; i > -STREAK_MAX_WEEKS; i -= 1) {
    if ((counts.get(i) ?? 0) < target) break;
    streak += 1;
  }
  return streak;
}
