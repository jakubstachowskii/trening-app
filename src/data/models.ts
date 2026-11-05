// Kształt danych w aplikacji (camelCase). Repozytoria mapują je z i na kolumny bazy (snake_case).
import type { ExerciseType, SetKind } from '@/domain/types';

export const MUSCLES = [
  'chest',
  'lats',
  'upper_back',
  'traps',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lower_back',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'machine',
  'cable',
  'smith',
  'ez_bar',
  'trap_bar',
  'bodyweight',
  'band',
  'plate',
  'other',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export type Exercise = {
  id: string;
  source: 'builtin' | 'user';
  /** Tylko własne ćwiczenia. Nazwy gotowych są w tłumaczeniach: `exercises.<id>`. */
  name: string | null;
  type: ExerciseType;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment;
  note: string | null;
  isHidden: boolean;
};

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  level: Level | null;
  sourceProgramId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PlanExercise = {
  id: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  repsMin: number | null;
  repsMax: number | null;
  targetWeightKg: number | null;
  targetDurationSec: number | null;
  restSec: number | null;
  note: string | null;
};

export type PlanDay = { id: string; name: string; position: number; exercises: PlanExercise[] };

export type PlanWithDays = Plan & { days: PlanDay[] };

export type WorkoutSet = {
  id: string;
  position: number;
  kind: SetKind;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  rpe: number | null;
  completedAt: string | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  position: number;
  note: string | null;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  planDayId: string | null;
  startedAt: string;
  finishedAt: string | null;
  note: string | null;
  bodyweightKg: number | null;
};

export type WorkoutWithExercises = Workout & { exercises: WorkoutExercise[] };

export type BodyweightEntry = { id: string; date: string; weightKg: number };
