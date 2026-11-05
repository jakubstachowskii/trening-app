import { computeRecords, newRecordsInWorkout, type HistorySet } from './records';

const s = (workoutId: string, date: string, over: Partial<HistorySet>): HistorySet => ({
  workoutId,
  date,
  kind: 'working',
  completedAt: date,
  ...over,
});

const W1 = '2026-10-01T10:00:00Z';
const W2 = '2026-10-08T10:00:00Z';
const W3 = '2026-10-15T10:00:00Z';

const bench: HistorySet[] = [
  s('w1', W1, { reps: 8, weightKg: 80 }),
  s('w1', W1, { reps: 8, weightKg: 80 }),
  s('w2', W2, { reps: 5, weightKg: 90 }),
  s('w2', W2, { kind: 'warmup', reps: 3, weightKg: 100 }),
  s('w3', W3, { reps: 12, weightKg: 60 }),
  s('w3', W3, { reps: 1, weightKg: 95, completedAt: null }),
];

describe('computeRecords (ćwiczenie z ciężarem)', () => {
  const records = computeRecords('weight_reps', bench);

  it('najcięższa seria: tylko ukończone serie robocze', () => {
    expect(records.heaviestWeight).toMatchObject({ value: 90, workoutId: 'w2', reps: 5 });
  });

  it('najlepsze szacowane 1RM', () => {
    // 90 × (1 + 5/30) = 105; 80 × (1 + 8/30) ≈ 101,3; 60 × (1 + 12/30) = 84
    expect(records.bestOneRepMax?.value).toBeCloseTo(105, 5);
    expect(records.bestOneRepMax?.workoutId).toBe('w2');
  });

  it('najwięcej powtórzeń w serii', () => {
    expect(records.mostReps).toMatchObject({ value: 12, workoutId: 'w3' });
  });

  it('największa objętość w treningu', () => {
    expect(records.bestWorkoutVolume).toMatchObject({ value: 1280, workoutId: 'w1' });
  });

  it('najwięcej powtórzeń przy danym ciężarze', () => {
    expect(records.repsAtWeight).toEqual([
      { weightKg: 60, reps: 12, workoutId: 'w3', date: W3 },
      { weightKg: 80, reps: 8, workoutId: 'w1', date: W1 },
      { weightKg: 90, reps: 5, workoutId: 'w2', date: W2 },
    ]);
  });

  it('przy remisie rekord zostaje przy pierwszym treningu', () => {
    const tie = computeRecords('weight_reps', [
      s('a', W1, { reps: 5, weightKg: 100 }),
      s('b', W2, { reps: 5, weightKg: 100 }),
    ]);
    expect(tie.heaviestWeight?.workoutId).toBe('a');
  });

  it('bez historii nie ma rekordów', () => {
    expect(computeRecords('weight_reps', [])).toEqual({
      heaviestWeight: null,
      bestOneRepMax: null,
      mostReps: null,
      bestWorkoutVolume: null,
      longestDuration: null,
      repsAtWeight: [],
    });
  });
});

describe('computeRecords (inne typy)', () => {
  it('podciąganie z obciążnikiem: najcięższy obciążnik i 1RM z masą ciała', () => {
    const r = computeRecords('weighted_bodyweight', [
      s('w1', W1, { reps: 5, weightKg: 20, bodyweightKg: 80 }),
    ]);
    expect(r.heaviestWeight?.value).toBe(20);
    expect(r.bestOneRepMax?.value).toBeCloseTo(100 * (1 + 5 / 30), 5);
  });

  it('z masą ciała: bez rekordu ciężaru, ale z rekordem powtórzeń', () => {
    const r = computeRecords('bodyweight_reps', [s('w1', W1, { reps: 15 })]);
    expect(r.heaviestWeight).toBeNull();
    expect(r.bestOneRepMax).toBeNull();
    expect(r.mostReps?.value).toBe(15);
  });

  it('na czas: najdłuższa seria', () => {
    const r = computeRecords('time', [
      s('w1', W1, { durationSec: 60 }),
      s('w2', W2, { durationSec: 95 }),
    ]);
    expect(r.longestDuration).toMatchObject({ value: 95, workoutId: 'w2' });
    expect(r.mostReps).toBeNull();
  });
});

describe('newRecordsInWorkout', () => {
  it('wskazuje rekordy pobite w danym treningu', () => {
    expect(newRecordsInWorkout('weight_reps', bench, 'w2')).toEqual([
      'heaviestWeight',
      'bestOneRepMax',
    ]);
    expect(newRecordsInWorkout('weight_reps', bench, 'w3')).toEqual(['mostReps']);
  });

  it('pierwszy trening z ćwiczeniem nie jest pokazywany jako rekord', () => {
    expect(newRecordsInWorkout('weight_reps', bench, 'w1')).toEqual([]);
  });

  it('wyrównanie rekordu nie jest nowym rekordem', () => {
    const history = [
      s('a', W1, { reps: 5, weightKg: 100 }),
      s('b', W2, { reps: 5, weightKg: 100 }),
    ];
    expect(newRecordsInWorkout('weight_reps', history, 'b')).toEqual([]);
  });
});
