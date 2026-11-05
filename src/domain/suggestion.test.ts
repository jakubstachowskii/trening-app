import type { LoggedSet } from './types';
import { DEFAULT_WEIGHT_STEP_KG, suggestNextWeight } from './suggestion';

const done = '2026-11-05T10:00:00Z';
const working = (reps: number, weightKg: number | null): LoggedSet => ({
  kind: 'working',
  reps,
  weightKg,
  completedAt: done,
});

describe('suggestNextWeight (progresja podwójna)', () => {
  it('gdy wszystkie serie robocze doszły do górnego zakresu: + krok', () => {
    expect(
      suggestNextWeight({
        type: 'weight_reps',
        lastSets: [working(10, 60), working(10, 60), working(11, 60)],
        repsMax: 10,
      }),
    ).toEqual({ weightKg: 62.5, reason: 'increase' });
  });

  it('gdy choć jedna seria nie doszła do górnego zakresu: ten sam ciężar', () => {
    expect(
      suggestNextWeight({
        type: 'weight_reps',
        lastSets: [working(10, 60), working(8, 60)],
        repsMax: 10,
      }),
    ).toEqual({ weightKg: 60, reason: 'same' });
  });

  it('krok jest konfigurowalny, domyślnie 2,5 kg', () => {
    expect(DEFAULT_WEIGHT_STEP_KG).toBe(2.5);
    expect(
      suggestNextWeight({
        type: 'weight_reps',
        lastSets: [working(12, 20)],
        repsMax: 12,
        stepKg: 1,
      }),
    ).toEqual({ weightKg: 21, reason: 'increase' });
  });

  it('przy różnych ciężarach bierze najcięższą serię roboczą', () => {
    expect(
      suggestNextWeight({
        type: 'weight_reps',
        lastSets: [working(10, 55), working(10, 60)],
        repsMax: 10,
      }),
    ).toEqual({ weightKg: 62.5, reason: 'increase' });
  });

  it('pomija rozgrzewkę i serie nieukończone', () => {
    expect(
      suggestNextWeight({
        type: 'weight_reps',
        lastSets: [
          { kind: 'warmup', reps: 5, weightKg: 40, completedAt: done },
          working(10, 60),
          { kind: 'working', reps: 3, weightKg: 60, completedAt: null },
        ],
        repsMax: 10,
      }),
    ).toEqual({ weightKg: 62.5, reason: 'increase' });
  });

  it('obciążnik przy podciąganiu też rośnie', () => {
    expect(
      suggestNextWeight({ type: 'weighted_bodyweight', lastSets: [working(8, 10)], repsMax: 8 }),
    ).toEqual({ weightKg: 12.5, reason: 'increase' });
  });

  it('bez historii, bez ciężaru albo dla innych typów: brak podpowiedzi', () => {
    expect(suggestNextWeight({ type: 'weight_reps', lastSets: [], repsMax: 10 })).toBeNull();
    expect(
      suggestNextWeight({ type: 'weight_reps', lastSets: [working(10, null)], repsMax: 10 }),
    ).toBeNull();
    expect(
      suggestNextWeight({ type: 'bodyweight_reps', lastSets: [working(10, null)], repsMax: 10 }),
    ).toBeNull();
    expect(suggestNextWeight({ type: 'time', lastSets: [working(1, 10)], repsMax: 1 })).toBeNull();
  });
});
