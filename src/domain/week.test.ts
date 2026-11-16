import { estimateDayMinutes } from './workout/estimate';
import {
  clampWeeklyGoal,
  isRestDay,
  mondayIndex,
  nextTrainingDate,
  weekDays,
  weekDoneCount,
  weekStreak,
  weekTarget,
  WEEKLY_GOAL_DEFAULT,
} from './week';

// Czwartek 19.11.2026, tydzień od poniedziałku 16.11. Daty lokalne (bez strefy), jak w aplikacji.
const NOW = new Date(2026, 10, 19, 18, 0);
const at = (month: number, day: number, hour = 10) =>
  new Date(2026, month, day, hour).toISOString();

describe('cel tygodnia', () => {
  it('z planem: liczba dni planu (najwyżej 7), bez planu: cel 2–6', () => {
    expect(weekTarget(4, 3)).toBe(4);
    expect(weekTarget(9, 3)).toBe(7);
    expect(weekTarget(null, 5)).toBe(5);
    expect(weekTarget(0, 5)).toBe(5);
    expect(weekTarget(null, 9)).toBe(6);
    expect(clampWeeklyGoal(1)).toBe(2);
    expect(clampWeeklyGoal(Number.NaN)).toBe(WEEKLY_GOAL_DEFAULT);
  });
});

describe('bieżący tydzień', () => {
  const starts = [at(10, 16), at(10, 17), at(10, 15), at(10, 23)];

  it('liczy tylko treningi od poniedziałku do niedzieli', () => {
    expect(weekDoneCount(starts, NOW)).toBe(2);
  });

  it('dni: zrobione i dziś', () => {
    const days = weekDays(starts, NOW);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.done)).toEqual([true, true, false, false, false, false, false]);
    expect(days.findIndex((d) => d.today)).toBe(3);
    expect(days[0]?.date.getDate()).toBe(16);
  });
});

describe('seria tygodni', () => {
  it('kolejne pełne tygodnie wstecz; niedokończony bieżący nie przerywa', () => {
    const starts = [
      at(10, 2),
      at(10, 4),
      at(10, 9),
      at(10, 12),
      at(10, 16), // bieżący tydzień: 1 z 2
    ];
    expect(weekStreak(starts, 2, NOW)).toBe(2);
  });

  it('bieżący tydzień dolicza się po osiągnięciu celu', () => {
    const starts = [at(10, 9), at(10, 12), at(10, 16), at(10, 18)];
    expect(weekStreak(starts, 2, NOW)).toBe(2);
  });

  it('dziura przerywa serię', () => {
    const starts = [at(9, 26), at(9, 28), at(10, 16), at(10, 17)];
    expect(weekStreak(starts, 2, NOW)).toBe(1);
    expect(weekStreak([], 3, NOW)).toBe(0);
  });
});

describe('szacowany czas dnia', () => {
  it('serie × (45 s + przerwa), zaokrąglone do 5 min', () => {
    expect(estimateDayMinutes([])).toBe(0);
    // 4 × (45 + 120) = 660 s = 11 min → 10
    expect(estimateDayMinutes([{ targetSets: 4, restSec: null }])).toBe(10);
    // 3 × (60 + 60) = 6 min → 5; plus 3 × (45 + 90) = 6,75 min → razem 12,75 → 15
    expect(
      estimateDayMinutes([
        { targetSets: 3, restSec: 60, targetDurationSec: 60 },
        { targetSets: 3, restSec: 90 },
      ]),
    ).toBe(15);
    expect(estimateDayMinutes([{ targetSets: 1, restSec: 0 }])).toBe(5);
  });
});

describe('dni treningowe planu', () => {
  const MWF = [0, 2, 4];

  it('cel = liczba wybranych dni, ważniejsza niż liczba dni planu', () => {
    expect(weekTarget(3, 3, [0, 1, 2, 3, 4, 5])).toBe(6);
    expect(weekTarget(3, 5, [])).toBe(3);
  });

  it('dni zaplanowane w pasku tygodnia', () => {
    expect(weekDays([], NOW, MWF).map((d) => d.planned)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ]);
    expect(weekDays([], NOW).some((d) => d.planned)).toBe(false);
  });

  it('dzień wolny i następny dzień treningowy', () => {
    expect(mondayIndex(NOW)).toBe(3);
    expect(isRestDay(MWF, NOW)).toBe(true);
    expect(isRestDay(null, NOW)).toBe(false);
    expect(nextTrainingDate(MWF, NOW)?.getDate()).toBe(20);
    // Niedziela → poniedziałek następnego tygodnia.
    expect(nextTrainingDate(MWF, new Date(2026, 10, 22, 9))?.getDate()).toBe(23);
    expect(nextTrainingDate(null, NOW)).toBeNull();
  });
});
