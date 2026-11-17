import { planWeek } from './planWeek';
import { recommendProgram } from './recommend';
import { weeklyHistory } from './week';

// Czwartek 19.11.2026, tydzień od poniedziałku 16.11. Daty lokalne, jak w aplikacji.
const NOW = new Date(2026, 10, 19, 18, 0);
const at = (day: number, hour = 10) => new Date(2026, 10, day, hour).toISOString();
const ABC = ['a', 'b', 'c'];

describe('polecany program', () => {
  it('2–3 całe ciało, 4 góra/dół, 5–6 PPL (wartości spoza zakresu przycięte)', () => {
    expect(recommendProgram(2)).toBe('full-body-3');
    expect(recommendProgram(3)).toBe('full-body-3');
    expect(recommendProgram(4)).toBe('upper-lower-4');
    expect(recommendProgram(5)).toBe('push-pull-legs');
    expect(recommendProgram(6)).toBe('push-pull-legs');
    expect(recommendProgram(1)).toBe('full-body-3');
    expect(recommendProgram(9)).toBe('push-pull-legs');
  });
});

describe('tydzień planu', () => {
  it('nowy plan: tyle pozycji, ile cel, po kolei, pierwszy z „Zacznij”', () => {
    const rows = planWeek({
      dayIds: ABC,
      lastDoneDayId: null,
      doneThisWeek: [],
      target: 3,
      weekdays: null,
      now: NOW,
    });
    expect(rows.map((r) => r.dayId)).toEqual(['a', 'b', 'c']);
    expect(rows.map((r) => r.kind === 'next' && r.current)).toEqual([true, false, false]);
  });

  it('cel większy niż liczba treningów: rotacja zawija (PPL 5 razy)', () => {
    const rows = planWeek({
      dayIds: ['push', 'pull', 'legs'],
      lastDoneDayId: null,
      doneThisWeek: [],
      target: 5,
      weekdays: null,
      now: NOW,
    });
    expect(rows.map((r) => r.dayId)).toEqual(['push', 'pull', 'legs', 'push', 'pull']);
  });

  it('cel mniejszy niż liczba treningów: reszta przechodzi na następny tydzień', () => {
    const rows = planWeek({
      dayIds: ['ua', 'la', 'ub', 'lb'],
      lastDoneDayId: 'la',
      doneThisWeek: [],
      target: 3,
      weekdays: null,
      now: NOW,
    });
    expect(rows.map((r) => r.dayId)).toEqual(['ub', 'lb', 'ua']);
  });

  it('zrobione w tym tygodniu na górze (także trening bez planu), potem kolejne', () => {
    const rows = planWeek({
      dayIds: ABC,
      lastDoneDayId: 'a',
      doneThisWeek: [
        { dayId: 'a', startedAt: at(16) },
        { dayId: null, startedAt: at(17) },
      ],
      target: 3,
      weekdays: null,
      now: NOW,
    });
    expect(rows.map((r) => [r.kind, r.dayId])).toEqual([
      ['done', 'a'],
      ['done', null],
      ['next', 'b'],
    ]);
  });

  it('cel osiągnięty: same zrobione, bez „Zacznij”', () => {
    const rows = planWeek({
      dayIds: ABC,
      lastDoneDayId: 'b',
      doneThisWeek: [
        { dayId: 'a', startedAt: at(16) },
        { dayId: 'b', startedAt: at(18) },
      ],
      target: 2,
      weekdays: null,
      now: NOW,
    });
    expect(rows.every((r) => r.kind === 'done')).toBe(true);
  });

  it('wybrane dni: kolejne pozycje dostają najbliższe dni treningowe (dziś, jeśli jeszcze bez treningu)', () => {
    // pn, czw, sob; dziś czwartek bez treningu.
    const rows = planWeek({
      dayIds: ABC,
      lastDoneDayId: 'a',
      doneThisWeek: [{ dayId: 'a', startedAt: at(16) }],
      target: 3,
      weekdays: [0, 3, 5],
      now: NOW,
    });
    const next = rows.filter((r) => r.kind === 'next');
    expect(next.map((r) => r.kind === 'next' && r.date?.getDate())).toEqual([19, 21]);
  });

  it('wybrane dni i trening już dziś: dzisiejszy dzień nie jest proponowany drugi raz', () => {
    const rows = planWeek({
      dayIds: ABC,
      lastDoneDayId: 'a',
      doneThisWeek: [{ dayId: 'a', startedAt: at(19, 8) }],
      target: 3,
      weekdays: [0, 3, 5],
      now: NOW,
    });
    const next = rows.filter((r) => r.kind === 'next');
    // Zostaje tylko sobota; druga pozycja nie ma już dnia w tym tygodniu.
    expect(next.map((r) => r.kind === 'next' && (r.date?.getDate() ?? null))).toEqual([21, null]);
  });

  it('plan bez treningów: pozycje bez treningu (null)', () => {
    const rows = planWeek({
      dayIds: [],
      lastDoneDayId: null,
      doneThisWeek: [],
      target: 2,
      weekdays: null,
      now: NOW,
    });
    expect(rows.map((r) => r.dayId)).toEqual([null, null]);
  });
});

describe('regularność', () => {
  it('12 tygodni od najstarszego do bieżącego, liczba treningów w każdym', () => {
    const weeks = weeklyHistory([at(16), at(18), new Date(2026, 10, 10).toISOString()], NOW);
    expect(weeks).toHaveLength(12);
    expect(weeks[11].done).toBe(2);
    expect(weeks[10].done).toBe(1);
    expect(weeks[11].weekStart.getDate()).toBe(16);
    expect(weeks[0].done).toBe(0);
  });

  it('treningi starsze niż zakres i z przyszłości są pomijane', () => {
    const weeks = weeklyHistory(
      [new Date(2026, 0, 5).toISOString(), new Date(2026, 11, 1).toISOString()],
      NOW,
      4,
    );
    expect(weeks.map((w) => w.done)).toEqual([0, 0, 0, 0]);
  });
});
