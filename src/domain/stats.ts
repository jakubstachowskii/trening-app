// Statystyki tygodnia i zakresy dat wykresów. Tydzień i miesiące liczone w lokalnej strefie czasu.

const DAYS_IN_WEEK = 7;

/** Poniedziałek 00:00 lokalnie dla tygodnia, w którym leży data. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export type WeekSummary = {
  count: number;
  volumeKg: number;
  previousCount: number;
  previousVolumeKg: number;
  /** Zmiana objętości do poprzedniego tygodnia w procentach (zaokrąglona); null bez porównania. */
  volumeChangePct: number | null;
};

export function weekSummary(
  workouts: { startedAt: string; volumeKg: number }[],
  now: Date,
): WeekSummary {
  const thisWeek = startOfWeek(now);
  const nextWeek = addDays(thisWeek, DAYS_IN_WEEK);
  const lastWeek = addDays(thisWeek, -DAYS_IN_WEEK);

  const summary = { count: 0, volumeKg: 0, previousCount: 0, previousVolumeKg: 0 };
  for (const workout of workouts) {
    const started = new Date(workout.startedAt);
    if (started >= thisWeek && started < nextWeek) {
      summary.count += 1;
      summary.volumeKg += workout.volumeKg;
    } else if (started >= lastWeek && started < thisWeek) {
      summary.previousCount += 1;
      summary.previousVolumeKg += workout.volumeKg;
    }
  }

  const volumeChangePct =
    summary.previousVolumeKg > 0
      ? Math.round((summary.volumeKg / summary.previousVolumeKg - 1) * 100)
      : null;
  return { ...summary, volumeChangePct };
}

export type ChartRange = '1m' | '3m' | '6m' | '1y' | 'all';

const RANGE_MONTHS: Record<Exclude<ChartRange, 'all'>, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12,
};

/** Początek zakresu wykresu (00:00 lokalnie); dla „całość” null. */
export function rangeStart(range: ChartRange, now: Date): Date | null {
  if (range === 'all') return null;
  const months = RANGE_MONTHS[range];
  const year = now.getFullYear();
  const month = now.getMonth() - months;
  const lastDayOfTarget = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(now.getDate(), lastDayOfTarget));
}
