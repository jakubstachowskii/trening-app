import type { LoggedSet } from '../types';
import {
  adjustRest,
  completedCount,
  elapsedSec,
  formatClock,
  formatKeypadValue,
  initialExerciseIndex,
  isFinished,
  nextExerciseIndex,
  nextPendingSetIndex,
  nextPlanDayId,
  parseKeypadValue,
  parseRestTimer,
  prefillSets,
  pressKey,
  primaryAction,
  remainingSec,
  ringProgress,
  startRest,
  stepValue,
  summarizeWorkout,
} from '.';

const done = '2026-11-10T10:00:00Z';
const w = (reps: number, weightKg: number | null): LoggedSet => ({
  kind: 'working',
  reps,
  weightKg,
  completedAt: done,
});

describe('prefillSets', () => {
  it('bez historii: liczba serii i cele z planu', () => {
    expect(
      prefillSets({
        type: 'weight_reps',
        target: { targetSets: 3, repsMin: 8, repsMax: 10, targetWeightKg: 60 },
        lastSets: [],
      }),
    ).toEqual([
      { kind: 'working', reps: 10, weightKg: 60, durationSec: null },
      { kind: 'working', reps: 10, weightKg: 60, durationSec: null },
      { kind: 'working', reps: 10, weightKg: 60, durationSec: null },
    ]);
  });

  it('ostatnio nie doszło do górnego zakresu: ten sam ciężar z tej samej serii', () => {
    const sets = prefillSets({
      type: 'weight_reps',
      target: { targetSets: 3, repsMin: 8, repsMax: 10 },
      lastSets: [w(10, 80), w(8, 77.5)],
    });
    expect(sets.map((s) => s.weightKg)).toEqual([80, 77.5, 77.5]);
    expect(sets.map((s) => s.reps)).toEqual([10, 10, 10]);
  });

  it('ostatnio wszystkie serie na górze zakresu: + krok i dolny zakres powtórzeń', () => {
    const sets = prefillSets({
      type: 'weight_reps',
      target: { targetSets: 2, repsMin: 8, repsMax: 10 },
      lastSets: [w(10, 80), w(10, 80)],
    });
    expect(sets).toEqual([
      { kind: 'working', reps: 8, weightKg: 82.5, durationSec: null },
      { kind: 'working', reps: 8, weightKg: 82.5, durationSec: null },
    ]);
  });

  it('rozgrzewka i nieukończone serie z historii się nie liczą', () => {
    const sets = prefillSets({
      type: 'weight_reps',
      target: {},
      lastSets: [
        { kind: 'warmup', reps: 10, weightKg: 40, completedAt: done },
        w(6, 100),
        { kind: 'working', reps: 6, weightKg: 100, completedAt: null },
      ],
    });
    expect(sets).toEqual([{ kind: 'working', reps: 6, weightKg: 100, durationSec: null }]);
  });

  it('ćwiczenie dodane bez planu i historii: 3 puste serie', () => {
    expect(prefillSets({ type: 'weight_reps', target: {}, lastSets: [] })).toHaveLength(3);
  });

  it('masa ciała bez ciężaru, ćwiczenie na czas bez powtórzeń', () => {
    expect(
      prefillSets({
        type: 'bodyweight_reps',
        target: { targetSets: 1, repsMax: 12, targetWeightKg: 10 },
        lastSets: [],
      }),
    ).toEqual([{ kind: 'working', reps: 12, weightKg: null, durationSec: null }]);
    expect(
      prefillSets({ type: 'time', target: { targetSets: 1, targetDurationSec: 60 }, lastSets: [] }),
    ).toEqual([{ kind: 'working', reps: null, weightKg: null, durationSec: 60 }]);
  });
});

describe('postęp w treningu', () => {
  const ex = (...flags: boolean[]) => ({
    sets: flags.map((f) => ({ completedAt: f ? done : null })),
  });

  it('następna seria i liczba zrobionych', () => {
    expect(nextPendingSetIndex(ex(true, false, false))).toBe(1);
    expect(nextPendingSetIndex(ex(true))).toBe(-1);
    expect(completedCount(ex(true, true, false))).toBe(2);
  });

  it('następne ćwiczenie: dalej na liście, potem od początku', () => {
    const list = [ex(false), ex(true), ex(false)];
    expect(nextExerciseIndex(list, 0)).toBe(2);
    expect(nextExerciseIndex(list, 2)).toBe(0);
    expect(nextExerciseIndex([ex(true), ex(false)], 1)).toBe(-1);
  });

  it('przycisk: odhacz → następne ćwiczenie → zakończ', () => {
    expect(primaryAction([ex(true, false), ex(false)], 0)).toEqual({
      kind: 'complete',
      setIndex: 1,
    });
    expect(primaryAction([ex(true), ex(false)], 0)).toEqual({
      kind: 'nextExercise',
      exerciseIndex: 1,
    });
    expect(primaryAction([ex(true), ex(true)], 1)).toEqual({ kind: 'finish' });
    expect(primaryAction([], 0)).toEqual({ kind: 'finish' });
  });

  it('wznowienie zaczyna od pierwszego ćwiczenia z czymś do zrobienia', () => {
    expect(initialExerciseIndex([ex(true), ex(true, false), ex(false)])).toBe(1);
    expect(initialExerciseIndex([ex(true), ex(true)])).toBe(1);
    expect(initialExerciseIndex([])).toBe(0);
  });

  it('kolejny dzień planu z zawijaniem', () => {
    expect(nextPlanDayId(['a', 'b', 'c'], null)).toBe('a');
    expect(nextPlanDayId(['a', 'b', 'c'], 'b')).toBe('c');
    expect(nextPlanDayId(['a', 'b', 'c'], 'c')).toBe('a');
    expect(nextPlanDayId(['a', 'b'], 'usunięty')).toBe('a');
    expect(nextPlanDayId([], 'a')).toBeNull();
  });
});

describe('minutnik przerwy', () => {
  const now = 1_000_000;

  it('liczy od znacznika końca', () => {
    const t = startRest(90, 's1', now);
    expect(remainingSec(t, now)).toBe(90);
    expect(remainingSec(t, now + 500)).toBe(90);
    expect(remainingSec(t, now + 60_000)).toBe(30);
    expect(ringProgress(t, now + 45_000)).toBeCloseTo(0.5);
    expect(isFinished(t, now + 90_000)).toBe(true);
    expect(remainingSec(t, now + 999_000)).toBe(0);
  });

  it('−15/+15 s; dodanie ponad długość powiększa pierścień', () => {
    const t = startRest(30, 's1', now);
    const longer = adjustRest(t, 15, now);
    expect(remainingSec(longer, now)).toBe(45);
    expect(longer.totalSec).toBe(45);
    expect(ringProgress(longer, now)).toBe(1);
    const shorter = adjustRest(t, -15, now);
    expect(remainingSec(shorter, now)).toBe(15);
    expect(shorter.totalSec).toBe(30);
    expect(remainingSec(adjustRest(shorter, -15, now), now)).toBe(0);
    expect(remainingSec(adjustRest(t, -60, now), now)).toBe(0);
  });

  it('odczyt z ustawień odrzuca uszkodzone wpisy', () => {
    expect(parseRestTimer({ endsAt: 5, totalSec: 60, setId: 'x' })).toEqual({
      endsAt: 5,
      totalSec: 60,
      setId: 'x',
    });
    expect(parseRestTimer(null)).toBeNull();
    expect(parseRestTimer({ endsAt: '5', totalSec: 60, setId: 'x' })).toBeNull();
  });
});

describe('klawiatura', () => {
  it('cyfry, przecinek, kasowanie', () => {
    expect(pressKey('8', '2', 'weight')).toBe('82');
    expect(pressKey('82', ',', 'weight')).toBe('82,');
    expect(pressKey('82,', '5', 'weight')).toBe('82,5');
    expect(pressKey('82,5', ',', 'weight')).toBe('82,5');
    expect(pressKey('82,25', '5', 'weight')).toBe('82,25');
    expect(pressKey('82,5', 'back', 'weight')).toBe('82,');
    expect(pressKey('', ',', 'weight')).toBe('0,');
    expect(pressKey('0', '5', 'reps')).toBe('5');
  });

  it('pierwsze naciśnięcie zastępuje starą wartość', () => {
    expect(pressKey('80', '9', 'weight', true)).toBe('9');
    expect(pressKey('80', 'back', 'weight', true)).toBe('');
  });

  it('powtórzenia i czas bez przecinka; limity', () => {
    expect(pressKey('8', ',', 'reps')).toBe('8');
    expect(pressKey('999', '9', 'reps')).toBe('999');
    expect(pressKey('999', '9', 'weight')).toBe('999');
    expect(pressKey('599', '9', 'duration')).toBe('5999');
    expect(pressKey('5999', '0', 'duration')).toBe('5999');
  });

  it('parsowanie z przecinkiem i kropką, formatowanie', () => {
    expect(parseKeypadValue('82,5')).toBe(82.5);
    expect(parseKeypadValue('82.5')).toBe(82.5);
    expect(parseKeypadValue('82,')).toBe(82);
    expect(parseKeypadValue('')).toBeNull();
    expect(formatKeypadValue(82.5, 'weight')).toBe('82,5');
    expect(formatKeypadValue(8, 'reps')).toBe('8');
    expect(formatKeypadValue(null, 'reps')).toBe('');
  });

  it('kroki −/+ bez wartości ujemnych', () => {
    expect(stepValue(80, 1, 'weight')).toBe(82.5);
    expect(stepValue(80, 1, 'weight', 1.25)).toBe(81.25);
    expect(stepValue(1, -1, 'weight')).toBe(0);
    expect(stepValue(null, 1, 'reps')).toBe(1);
    expect(stepValue(0, -1, 'reps')).toBe(0);
    expect(stepValue(30, 1, 'duration')).toBe(35);
  });
});

describe('podsumowanie i zegar', () => {
  it('czas, objętość, serie, ćwiczenia', () => {
    expect(
      summarizeWorkout({
        startedAt: '2026-11-10T10:00:00Z',
        finishedAt: '2026-11-10T11:02:03Z',
        exercises: [
          { type: 'weight_reps', sets: [w(10, 80), w(8, 80), { ...w(5, 40), kind: 'warmup' }] },
          { type: 'weight_reps', sets: [{ ...w(5, 40), completedAt: null }] },
        ],
      }),
    ).toEqual({ durationSec: 3723, volumeKg: 1440, setCount: 2, exerciseCount: 1 });
  });

  it('licznik w nagłówku', () => {
    expect(elapsedSec('2026-11-10T10:00:00Z', Date.parse('2026-11-10T10:32:14Z'))).toBe(1934);
    expect(formatClock(1934)).toBe('32:14');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(3909)).toBe('1:05:09');
  });
});
