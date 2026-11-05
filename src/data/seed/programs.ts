// Gotowe programy. Nie siedzą w bazie: użytkownik kopiuje program do „moich planów” (plans.copyProgram).
// Teksty: src/i18n/locales/pl.json → programs.<id>.name / description / days.<key>.
import type { Level } from '../models';

export type ProgramExercise = {
  exerciseId: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  durationSec?: number;
  restSec: number;
};

export type BuiltinProgram = {
  id: string;
  level: Level;
  daysPerWeek: number;
  days: { key: string; exercises: ProgramExercise[] }[];
};

const reps = (
  exerciseId: string,
  sets: number,
  repsMin: number,
  repsMax: number,
  restSec: number,
): ProgramExercise => ({ exerciseId, sets, repsMin, repsMax, restSec });

const hold = (
  exerciseId: string,
  sets: number,
  durationSec: number,
  restSec: number,
): ProgramExercise => ({ exerciseId, sets, durationSec, restSec });

export const BUILTIN_PROGRAMS: readonly BuiltinProgram[] = [
  {
    id: 'full-body-3',
    level: 'beginner',
    daysPerWeek: 3,
    days: [
      {
        key: 'a',
        exercises: [
          reps('back-squat', 3, 6, 10, 120),
          reps('bench-press', 3, 6, 10, 120),
          reps('barbell-row', 3, 8, 12, 90),
          reps('lateral-raise', 2, 12, 15, 60),
          hold('plank', 3, 45, 60),
        ],
      },
      {
        key: 'b',
        exercises: [
          reps('romanian-deadlift', 3, 8, 10, 120),
          reps('overhead-press', 3, 6, 10, 120),
          reps('lat-pulldown', 3, 8, 12, 90),
          reps('leg-press', 2, 10, 15, 90),
          reps('triceps-pushdown', 2, 10, 15, 60),
        ],
      },
      {
        key: 'c',
        exercises: [
          reps('leg-press', 3, 10, 12, 90),
          reps('incline-dumbbell-press', 3, 8, 12, 90),
          reps('seated-cable-row', 3, 8, 12, 90),
          reps('dumbbell-curl', 2, 10, 15, 60),
          reps('hanging-knee-raise', 3, 10, 15, 60),
        ],
      },
    ],
  },
  {
    id: 'upper-lower-4',
    level: 'intermediate',
    daysPerWeek: 4,
    days: [
      {
        key: 'upper-a',
        exercises: [
          reps('bench-press', 4, 5, 8, 150),
          reps('barbell-row', 4, 6, 10, 120),
          reps('overhead-press', 3, 6, 10, 120),
          reps('lat-pulldown', 3, 8, 12, 90),
          reps('barbell-curl', 2, 8, 12, 60),
          reps('triceps-pushdown', 2, 10, 15, 60),
        ],
      },
      {
        key: 'lower-a',
        exercises: [
          reps('back-squat', 4, 5, 8, 180),
          reps('romanian-deadlift', 3, 8, 10, 120),
          reps('leg-press', 3, 10, 12, 90),
          reps('lying-leg-curl', 3, 10, 15, 60),
          reps('standing-calf-raise', 4, 10, 15, 60),
        ],
      },
      {
        key: 'upper-b',
        exercises: [
          reps('incline-dumbbell-press', 4, 8, 12, 120),
          reps('pull-up', 4, 6, 10, 120),
          reps('dumbbell-shoulder-press', 3, 8, 12, 90),
          reps('seated-cable-row', 3, 10, 12, 90),
          reps('lateral-raise', 3, 12, 15, 60),
          reps('hammer-curl', 2, 10, 12, 60),
        ],
      },
      {
        key: 'lower-b',
        exercises: [
          reps('deadlift', 3, 3, 5, 180),
          reps('bulgarian-split-squat', 3, 8, 12, 90),
          reps('hip-thrust', 3, 8, 12, 90),
          reps('leg-extension', 3, 12, 15, 60),
          reps('seated-calf-raise', 4, 12, 15, 60),
          reps('hanging-leg-raise', 3, 10, 15, 60),
        ],
      },
    ],
  },
  {
    id: 'push-pull-legs',
    level: 'intermediate',
    daysPerWeek: 3,
    days: [
      {
        key: 'push',
        exercises: [
          reps('bench-press', 4, 6, 10, 150),
          reps('overhead-press', 3, 6, 10, 120),
          reps('incline-dumbbell-press', 3, 8, 12, 90),
          reps('lateral-raise', 3, 12, 15, 60),
          reps('triceps-pushdown', 3, 10, 15, 60),
          reps('overhead-cable-extension', 2, 10, 15, 60),
        ],
      },
      {
        key: 'pull',
        exercises: [
          reps('deadlift', 3, 4, 6, 180),
          reps('pull-up', 3, 6, 10, 120),
          reps('barbell-row', 3, 8, 10, 90),
          reps('face-pull', 3, 12, 15, 60),
          reps('barbell-curl', 3, 8, 12, 60),
          reps('hammer-curl', 2, 10, 12, 60),
        ],
      },
      {
        key: 'legs',
        exercises: [
          reps('back-squat', 4, 6, 10, 180),
          reps('romanian-deadlift', 3, 8, 10, 120),
          reps('leg-press', 3, 10, 15, 90),
          reps('lying-leg-curl', 3, 10, 15, 60),
          reps('standing-calf-raise', 4, 10, 15, 60),
        ],
      },
    ],
  },
  {
    id: 'strength-5x5',
    level: 'intermediate',
    daysPerWeek: 3,
    days: [
      {
        key: 'a',
        exercises: [
          reps('back-squat', 5, 5, 5, 180),
          reps('bench-press', 5, 5, 5, 180),
          reps('barbell-row', 5, 5, 5, 120),
        ],
      },
      {
        key: 'b',
        exercises: [
          reps('back-squat', 5, 5, 5, 180),
          reps('overhead-press', 5, 5, 5, 180),
          reps('deadlift', 1, 5, 5, 180),
        ],
      },
    ],
  },
];
