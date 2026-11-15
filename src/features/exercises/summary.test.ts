import type { WorkoutSet } from '@/data/models';
import type { HistorySet } from '@/domain/records';

import { exerciseSummary, headlineKind, historyByWorkout, recordList, topSet } from './summary';

const set = (over: Partial<WorkoutSet>): WorkoutSet => ({
  id: 's',
  position: 0,
  kind: 'working',
  reps: null,
  weightKg: null,
  durationSec: null,
  rpe: null,
  completedAt: '2026-11-01T10:00:00Z',
  ...over,
});

const hist = (workoutId: string, date: string, over: Partial<HistorySet>): HistorySet => ({
  workoutId,
  date,
  kind: 'working',
  completedAt: date,
  ...over,
});

describe('podsumowanie ćwiczenia', () => {
  it('główna liczba zależy od typu', () => {
    expect(headlineKind('weight_reps')).toBe('bestOneRepMax');
    expect(headlineKind('weighted_bodyweight')).toBe('bestOneRepMax');
    expect(headlineKind('bodyweight_reps')).toBe('mostReps');
    expect(headlineKind('assisted_bodyweight')).toBe('mostReps');
    expect(headlineKind('time')).toBe('longestDuration');
  });

  it('najlepsza seria: najcięższa, potem więcej powtórzeń; rozgrzewka i niezrobione pomijane', () => {
    const best = topSet('weight_reps', [
      set({ weightKg: 100, reps: 3, kind: 'warmup' }),
      set({ weightKg: 80, reps: 8 }),
      set({ weightKg: 80, reps: 10 }),
      set({ weightKg: 90, reps: 1, completedAt: null }),
    ]);
    expect(best).toEqual({ weightKg: 80, reps: 10, durationSec: null });
    expect(topSet('weight_reps', [])).toBeNull();
  });

  it('przy odciążeniu lepsza jest mniejsza pomoc; na czas najdłuższa seria', () => {
    expect(
      topSet('assisted_bodyweight', [
        set({ weightKg: 20, reps: 8 }),
        set({ weightKg: 10, reps: 8 }),
      ])?.weightKg,
    ).toBe(10);
    expect(topSet('time', [set({ durationSec: 30 }), set({ durationSec: 45 })])?.durationSec).toBe(
      45,
    );
  });

  it('bez historii: puste wartości', () => {
    expect(exerciseSummary('weight_reps', [], [])).toEqual({
      headline: { kind: 'bestOneRepMax', value: null },
      last: null,
    });
  });

  it('z historią: 1RM i ostatnia seria', () => {
    const history = [hist('w1', '2026-10-01T10:00:00Z', { weightKg: 100, reps: 1 })];
    const summary = exerciseSummary('weight_reps', history, [set({ weightKg: 80, reps: 8 })]);
    expect(summary.headline.value).toBe(100);
    expect(summary.last).toMatchObject({ weightKg: 80, reps: 8 });
  });

  it('historia po treningach, najnowsze na górze, bez rozgrzewki', () => {
    const groups = historyByWorkout([
      hist('w1', '2026-10-01T10:00:00Z', { weightKg: 60, reps: 10 }),
      hist('w1', '2026-10-01T10:00:00Z', { weightKg: 40, reps: 10, kind: 'warmup' }),
      hist('w2', '2026-10-08T10:00:00Z', { weightKg: 62.5, reps: 10 }),
    ]);
    expect(groups.map((g) => [g.workoutId, g.sets.length])).toEqual([
      ['w2', 1],
      ['w1', 1],
    ]);
  });

  it('lista rekordów bez pustych pozycji', () => {
    expect(recordList('weight_reps', [])).toEqual([]);
    const kinds = recordList('weight_reps', [
      hist('w1', '2026-10-01T10:00:00Z', { weightKg: 100, reps: 5 }),
    ]).map((r) => r.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(['heaviestWeight', 'bestOneRepMax', 'bestWorkoutVolume']),
    );
    expect(kinds).not.toContain('longestDuration');
  });
});
