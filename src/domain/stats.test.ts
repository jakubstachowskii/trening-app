import { rangeStart, startOfWeek, weekSummary } from './stats';

// Daty lokalne (konstruktor Date z polami) — testy działają w każdej strefie czasowej.
const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('startOfWeek', () => {
  it('tydzień zaczyna się w poniedziałek o północy', () => {
    expect(startOfWeek(local(2026, 11, 5))).toEqual(new Date(2026, 10, 2, 0, 0, 0, 0)); // czwartek
    expect(startOfWeek(local(2026, 11, 2, 0))).toEqual(new Date(2026, 10, 2)); // poniedziałek
    expect(startOfWeek(local(2026, 11, 8, 23))).toEqual(new Date(2026, 10, 2)); // niedziela
  });
});

describe('weekSummary', () => {
  const now = local(2026, 11, 5);
  const workouts = [
    { startedAt: local(2026, 11, 3).toISOString(), volumeKg: 5000 },
    { startedAt: local(2026, 11, 5, 8).toISOString(), volumeKg: 5600 },
    { startedAt: local(2026, 10, 28).toISOString(), volumeKg: 10000 },
    { startedAt: local(2026, 10, 20).toISOString(), volumeKg: 9000 },
  ];

  it('liczy treningi i objętość w bieżącym tygodniu i porównuje z poprzednim', () => {
    expect(weekSummary(workouts, now)).toEqual({
      count: 2,
      volumeKg: 10600,
      previousCount: 1,
      previousVolumeKg: 10000,
      volumeChangePct: 6,
    });
  });

  it('bez poprzedniego tygodnia nie ma porównania', () => {
    expect(weekSummary(workouts.slice(0, 2), now).volumeChangePct).toBeNull();
  });

  it('pusty tydzień', () => {
    expect(weekSummary([], now)).toEqual({
      count: 0,
      volumeKg: 0,
      previousCount: 0,
      previousVolumeKg: 0,
      volumeChangePct: null,
    });
  });
});

describe('rangeStart', () => {
  const now = local(2026, 11, 5);

  it('cofa się o pełne miesiące i rok', () => {
    expect(rangeStart('1m', now)).toEqual(new Date(2026, 9, 5));
    expect(rangeStart('3m', now)).toEqual(new Date(2026, 7, 5));
    expect(rangeStart('6m', now)).toEqual(new Date(2026, 4, 5));
    expect(rangeStart('1y', now)).toEqual(new Date(2025, 10, 5));
  });

  it('„całość” nie ma początku', () => {
    expect(rangeStart('all', now)).toBeNull();
  });

  it('31 marca minus miesiąc to koniec lutego, a nie 3 marca', () => {
    expect(rangeStart('1m', local(2026, 3, 31))).toEqual(new Date(2026, 1, 28));
  });
});
