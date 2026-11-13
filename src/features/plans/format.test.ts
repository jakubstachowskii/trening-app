import { formatDuration, formatPlanExercise, formatRepRange, formatTarget } from './format';

const base = {
  targetSets: 3,
  repsMin: 8,
  repsMax: 12,
  targetDurationSec: null,
  targetWeightKg: null,
  restSec: 120,
};

describe('opis ćwiczenia w planie', () => {
  it('zakres powtórzeń', () => {
    expect(formatRepRange(8, 12)).toBe('8–12');
    expect(formatRepRange(5, 5)).toBe('5');
    expect(formatRepRange(8, null)).toBe('8+');
    expect(formatRepRange(null, 12)).toBe('do 12');
    expect(formatRepRange(null, null)).toBe('');
  });

  it('czas', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(120)).toBe('2 min');
    expect(formatDuration(90)).toBe('1 min 30 s');
  });

  it('cel serii, z ciężarem i na czas', () => {
    expect(formatTarget(base)).toBe('3 × 8–12');
    expect(formatTarget({ ...base, targetWeightKg: 82.5 })).toBe('3 × 8–12 · 82,5 kg');
    expect(formatTarget({ ...base, targetDurationSec: 45 })).toBe('3 × 45 s');
    expect(formatTarget({ ...base, repsMin: null, repsMax: null })).toBe('3 ×');
  });

  it('pełny opis z przerwą', () => {
    expect(formatPlanExercise(base)).toBe('3 × 8–12 · przerwa 2 min');
    expect(formatPlanExercise({ ...base, restSec: null })).toBe('3 × 8–12');
  });
});
