// Tydzień aktywnego planu na karcie „Plan”: tyle pozycji, ile treningów w tygodniu (cel),
// najpierw zrobione w tym tygodniu, potem kolejne treningi planu po kolei (rotacja).
import { startOfWeek } from './stats';
import { mondayIndex } from './week';
import { nextPlanDayId } from './workout/progress';

const DAYS_IN_WEEK = 7;

export type PlanWeekDone = { dayId: string | null; startedAt: string };

export type PlanWeekRow =
  | { kind: 'done'; dayId: string | null; date: Date }
  /** `current` = pierwszy niezrobiony (przycisk „Zacznij”); `date` tylko przy wybranych dniach tygodnia. */
  | { kind: 'next'; dayId: string | null; current: boolean; date: Date | null };

export type PlanWeekInput = {
  /** Treningi planu w kolejności. */
  dayIds: readonly string[];
  /** Ostatni zakończony trening planu (także sprzed tego tygodnia). */
  lastDoneDayId: string | null;
  /** Zakończone treningi z tego tygodnia (dowolne, także bez planu), od najstarszego. */
  doneThisWeek: readonly PlanWeekDone[];
  target: number;
  /** Wybrane dni tygodnia planu (0 = poniedziałek) albo null. */
  weekdays: readonly number[] | null;
  now: Date;
};

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Wolne dni treningowe z planu od dziś do niedzieli (dziś tylko, jeśli dziś jeszcze nie było treningu). */
function upcomingDates(input: PlanWeekInput): Date[] {
  if (!input.weekdays?.length) return [];
  const today = dateOnly(input.now);
  const trainedToday = input.doneThisWeek.some(
    (d) => dateOnly(new Date(d.startedAt)).getTime() === today.getTime(),
  );
  const monday = startOfWeek(input.now);
  const out: Date[] = [];
  for (let i = 0; i < DAYS_IN_WEEK; i += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    if (date < today || (trainedToday && date.getTime() === today.getTime())) continue;
    if (input.weekdays.includes(mondayIndex(date))) out.push(date);
  }
  return out;
}

export function planWeek(input: PlanWeekInput): PlanWeekRow[] {
  const done: PlanWeekRow[] = input.doneThisWeek.map((d) => ({
    kind: 'done',
    dayId: d.dayId,
    date: new Date(d.startedAt),
  }));
  const left = Math.max(0, input.target - done.length);
  const dates = upcomingDates(input);
  const rows: PlanWeekRow[] = [...done];
  let last = input.lastDoneDayId;
  for (let i = 0; i < left; i += 1) {
    const dayId = nextPlanDayId(input.dayIds, last);
    rows.push({ kind: 'next', dayId, current: i === 0, date: dates[i] ?? null });
    last = dayId;
  }
  return rows;
}
