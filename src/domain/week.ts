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
 * Ile treningów na tydzień (segmenty pierścienia). Kolejność:
 * 1. wybrane dni treningowe planu → tyle, ile dni;
 * 2. cel tygodnia zapisany przez użytkownika (wprowadzenie, Ustawienia, „Dziś”) → niezależnie od planu,
 *    bo plan to tylko kolejność treningów (rotacja);
 * 3. cel nigdy niezapisany (`null`) i aktywny plan → liczba treningów planu (tak było przed celem tygodnia);
 * 4. domyślnie 3.
 */
export function weekTarget(
  planDayCount: number | null,
  weeklyGoal: number | null,
  weekdays: readonly number[] | null = null,
): number {
  if (weekdays?.length) return weekdays.length;
  if (weeklyGoal != null) return clampWeeklyGoal(weeklyGoal);
  if (planDayCount != null && planDayCount > 0) return Math.min(DAYS_IN_WEEK, planDayCount);
  return WEEKLY_GOAL_DEFAULT;
}

/**
 * Cel tygodnia do pokazania (Ustawienia, plakietka „Polecany”): zapisany, a gdy nigdy nie był zapisany —
 * liczba treningów aktywnego planu (tak liczy wtedy pierścień), inaczej domyślne 3.
 */
export function effectiveWeeklyGoal(saved: number | null, planDayCount: number | null): number {
  if (saved != null) return clampWeeklyGoal(saved);
  if (planDayCount != null && planDayCount > 0) return clampWeeklyGoal(planDayCount);
  return WEEKLY_GOAL_DEFAULT;
}

/** Dzień tygodnia od poniedziałku: 0 = poniedziałek, 6 = niedziela. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
}

/** Dziś nie ma treningu w planie (tylko gdy plan ma wybrane dni). */
export function isRestDay(weekdays: readonly number[] | null, now: Date): boolean {
  return Boolean(weekdays?.length) && !weekdays!.includes(mondayIndex(now));
}

/** Najbliższy dzień treningowy po dzisiejszym (null bez wybranych dni). */
export function nextTrainingDate(weekdays: readonly number[] | null, now: Date): Date | null {
  if (!weekdays?.length) return null;
  for (let i = 1; i <= DAYS_IN_WEEK; i += 1) {
    const date = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), i);
    if (weekdays.includes(mondayIndex(date))) return date;
  }
  return null;
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

/** `planned` = dzień treningowy z planu (tylko gdy plan ma wybrane dni). */
export type WeekDay = { date: Date; done: boolean; today: boolean; planned: boolean };

/** Poniedziałek–niedziela bieżącego tygodnia: czy był trening i czy to dziś. */
export function weekDays(
  startedAt: string[],
  now: Date,
  weekdays: readonly number[] | null = null,
): WeekDay[] {
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
    return {
      date,
      done: doneDays.has(date.getTime()),
      today: date.getTime() === today,
      planned: weekdays?.includes(i) ?? false,
    };
  });
}

export type WeekCount = { weekStart: Date; done: number };

/**
 * Regularność: liczba zakończonych treningów w ostatnich `weeks` tygodniach (od najstarszego do bieżącego).
 */
export function weeklyHistory(startedAt: string[], now: Date, weeks = 12): WeekCount[] {
  const thisWeek = startOfWeek(now);
  const counts = new Map<number, number>();
  for (const s of startedAt) {
    const i = weekIndex(new Date(s), thisWeek);
    if (i <= 0 && i > -weeks) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  return Array.from({ length: weeks }, (_, k) => {
    const i = k - weeks + 1;
    return { weekStart: addDays(thisWeek, i * DAYS_IN_WEEK), done: counts.get(i) ?? 0 };
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
