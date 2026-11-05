import type { LoggedSet } from './types';
import { effectiveLoadKg, setVolumeKg, totalDurationSec, workoutVolumeKg } from './volume';

const done = '2026-11-05T10:00:00Z';
const set = (over: Partial<LoggedSet>): LoggedSet => ({
  kind: 'working',
  completedAt: done,
  ...over,
});

describe('effectiveLoadKg', () => {
  it('ćwiczenie z ciężarem: ciężar sztangi lub hantli', () => {
    expect(effectiveLoadKg('weight_reps', 80, 75)).toBe(80);
    expect(effectiveLoadKg('weight_reps', null, 75)).toBeNull();
  });

  it('z masą ciała: sama masa ciała', () => {
    expect(effectiveLoadKg('bodyweight_reps', null, 75)).toBe(75);
    expect(effectiveLoadKg('bodyweight_reps', null, null)).toBeNull();
  });

  it('z obciążnikiem: masa ciała + obciążnik', () => {
    expect(effectiveLoadKg('weighted_bodyweight', 20, 75)).toBe(95);
    expect(effectiveLoadKg('weighted_bodyweight', null, 75)).toBe(75);
    expect(effectiveLoadKg('weighted_bodyweight', 20, null)).toBeNull();
  });

  it('z gumą: masa ciała − pomoc gumy, nigdy poniżej zera', () => {
    expect(effectiveLoadKg('assisted_bodyweight', 25, 75)).toBe(50);
    expect(effectiveLoadKg('assisted_bodyweight', 100, 75)).toBe(0);
  });

  it('na czas: brak obciążenia', () => {
    expect(effectiveLoadKg('time', 10, 75)).toBeNull();
  });
});

describe('setVolumeKg', () => {
  it('obciążenie × powtórzenia', () => {
    expect(setVolumeKg('weight_reps', set({ reps: 8, weightKg: 60 }), null)).toBe(480);
    expect(setVolumeKg('bodyweight_reps', set({ reps: 10 }), 80)).toBe(800);
  });

  it('bez powtórzeń albo bez obciążenia daje 0', () => {
    expect(setVolumeKg('weight_reps', set({ weightKg: 60 }), null)).toBe(0);
    expect(setVolumeKg('bodyweight_reps', set({ reps: 10 }), null)).toBe(0);
  });
});

describe('workoutVolumeKg', () => {
  it('sumuje tylko ukończone serie robocze', () => {
    const volume = workoutVolumeKg(
      [
        {
          type: 'weight_reps',
          sets: [
            set({ kind: 'warmup', reps: 10, weightKg: 40 }),
            set({ reps: 8, weightKg: 60 }),
            set({ reps: 8, weightKg: 60 }),
            set({ reps: 8, weightKg: 60, completedAt: null }),
          ],
        },
        { type: 'weighted_bodyweight', sets: [set({ reps: 5, weightKg: 10 })] },
        { type: 'time', sets: [set({ durationSec: 60 })] },
      ],
      80,
    );
    expect(volume).toBe(480 + 480 + 450);
  });

  it('pusty trening ma objętość 0', () => {
    expect(workoutVolumeKg([], null)).toBe(0);
  });
});

describe('totalDurationSec', () => {
  it('sumuje czas ukończonych serii roboczych', () => {
    expect(
      totalDurationSec([
        set({ durationSec: 60 }),
        set({ durationSec: 45 }),
        set({ kind: 'warmup', durationSec: 30 }),
        set({ durationSec: 90, completedAt: null }),
      ]),
    ).toBe(105);
  });
});
