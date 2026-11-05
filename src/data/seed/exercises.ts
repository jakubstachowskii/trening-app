// Gotowe ćwiczenia dostarczane z aplikacją. Nazwy: src/i18n/locales/pl.json → exercises.<id>.
// Id są stałe (nie zmieniamy ich po wydaniu): odwołują się do nich plany i historia.
// Zmiana listy = podbicie EXERCISES_VERSION (seed.ts odświeży gotowe ćwiczenia u użytkownika).
import type { ExerciseType } from '@/domain/types';

import type { Equipment, Muscle } from '../models';

export const EXERCISES_VERSION = 1;

export type BuiltinExercise = {
  id: string;
  type: ExerciseType;
  equipment: Equipment;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
};

const ex = (
  id: string,
  type: ExerciseType,
  equipment: Equipment,
  primaryMuscles: Muscle[],
  secondaryMuscles: Muscle[] = [],
): BuiltinExercise => ({ id, type, equipment, primaryMuscles, secondaryMuscles });

const W = 'weight_reps';
const BW = 'bodyweight_reps';
const WBW = 'weighted_bodyweight';
const ABW = 'assisted_bodyweight';
const T = 'time';

export const BUILTIN_EXERCISES: readonly BuiltinExercise[] = [
  // Klatka piersiowa
  ex('bench-press', W, 'barbell', ['chest'], ['front_delts', 'triceps']),
  ex('incline-bench-press', W, 'barbell', ['chest'], ['front_delts', 'triceps']),
  ex('decline-bench-press', W, 'barbell', ['chest'], ['triceps']),
  ex('close-grip-bench-press', W, 'barbell', ['triceps'], ['chest', 'front_delts']),
  ex('dumbbell-bench-press', W, 'dumbbell', ['chest'], ['front_delts', 'triceps']),
  ex('incline-dumbbell-press', W, 'dumbbell', ['chest'], ['front_delts', 'triceps']),
  ex('decline-dumbbell-press', W, 'dumbbell', ['chest'], ['triceps']),
  ex('dumbbell-fly', W, 'dumbbell', ['chest'], ['front_delts']),
  ex('incline-dumbbell-fly', W, 'dumbbell', ['chest'], ['front_delts']),
  ex('cable-crossover', W, 'cable', ['chest'], ['front_delts']),
  ex('low-cable-fly', W, 'cable', ['chest'], ['front_delts']),
  ex('pec-deck', W, 'machine', ['chest']),
  ex('machine-chest-press', W, 'machine', ['chest'], ['front_delts', 'triceps']),
  ex('incline-machine-press', W, 'machine', ['chest'], ['front_delts', 'triceps']),
  ex('smith-bench-press', W, 'smith', ['chest'], ['front_delts', 'triceps']),
  ex('smith-incline-press', W, 'smith', ['chest'], ['front_delts', 'triceps']),
  ex('push-up', BW, 'bodyweight', ['chest'], ['triceps', 'front_delts']),
  ex('incline-push-up', BW, 'bodyweight', ['chest'], ['triceps', 'front_delts']),
  ex('decline-push-up', BW, 'bodyweight', ['chest'], ['front_delts', 'triceps']),
  ex('diamond-push-up', BW, 'bodyweight', ['triceps'], ['chest']),
  ex('dip', BW, 'bodyweight', ['chest', 'triceps'], ['front_delts']),
  ex('weighted-dip', WBW, 'bodyweight', ['chest', 'triceps'], ['front_delts']),
  ex('assisted-dip', ABW, 'machine', ['chest', 'triceps'], ['front_delts']),
  ex('dumbbell-pullover', W, 'dumbbell', ['chest', 'lats'], ['triceps']),

  // Barki
  ex('overhead-press', W, 'barbell', ['front_delts'], ['side_delts', 'triceps']),
  ex('push-press', W, 'barbell', ['front_delts'], ['triceps', 'quads']),
  ex('dumbbell-shoulder-press', W, 'dumbbell', ['front_delts'], ['side_delts', 'triceps']),
  ex('arnold-press', W, 'dumbbell', ['front_delts', 'side_delts'], ['triceps']),
  ex('machine-shoulder-press', W, 'machine', ['front_delts'], ['side_delts', 'triceps']),
  ex('smith-shoulder-press', W, 'smith', ['front_delts'], ['side_delts', 'triceps']),
  ex('landmine-press', W, 'barbell', ['front_delts'], ['chest', 'triceps']),
  ex('lateral-raise', W, 'dumbbell', ['side_delts']),
  ex('cable-lateral-raise', W, 'cable', ['side_delts']),
  ex('machine-lateral-raise', W, 'machine', ['side_delts']),
  ex('front-raise', W, 'dumbbell', ['front_delts']),
  ex('plate-front-raise', W, 'plate', ['front_delts']),
  ex('rear-delt-fly', W, 'dumbbell', ['rear_delts'], ['upper_back']),
  ex('cable-rear-delt-fly', W, 'cable', ['rear_delts'], ['upper_back']),
  ex('reverse-pec-deck', W, 'machine', ['rear_delts'], ['upper_back']),
  ex('face-pull', W, 'cable', ['rear_delts'], ['upper_back', 'traps']),
  ex('band-pull-apart', BW, 'band', ['rear_delts'], ['upper_back']),
  ex('upright-row', W, 'barbell', ['side_delts'], ['traps']),
  ex('barbell-shrug', W, 'barbell', ['traps']),
  ex('dumbbell-shrug', W, 'dumbbell', ['traps']),

  // Plecy
  ex(
    'deadlift',
    W,
    'barbell',
    ['lower_back', 'glutes', 'hamstrings'],
    ['traps', 'quads', 'forearms'],
  ),
  ex('sumo-deadlift', W, 'barbell', ['glutes', 'quads', 'adductors'], ['hamstrings', 'lower_back']),
  ex('trap-bar-deadlift', W, 'trap_bar', ['quads', 'glutes'], ['hamstrings', 'lower_back']),
  ex('romanian-deadlift', W, 'barbell', ['hamstrings', 'glutes'], ['lower_back']),
  ex('dumbbell-deadlift', W, 'dumbbell', ['glutes', 'hamstrings', 'quads'], ['lower_back']),
  ex('dumbbell-romanian-deadlift', W, 'dumbbell', ['hamstrings', 'glutes'], ['lower_back']),
  ex('rack-pull', W, 'barbell', ['lower_back', 'traps'], ['glutes', 'forearms']),
  ex('good-morning', W, 'barbell', ['hamstrings', 'lower_back'], ['glutes']),
  ex('barbell-row', W, 'barbell', ['upper_back', 'lats'], ['rear_delts', 'biceps']),
  ex('underhand-barbell-row', W, 'barbell', ['lats', 'upper_back'], ['biceps']),
  ex('pendlay-row', W, 'barbell', ['upper_back', 'lats'], ['rear_delts', 'biceps']),
  ex('dumbbell-row', W, 'dumbbell', ['lats', 'upper_back'], ['biceps', 'rear_delts']),
  ex('chest-supported-row', W, 'dumbbell', ['upper_back'], ['lats', 'rear_delts']),
  ex('t-bar-row', W, 'barbell', ['upper_back', 'lats'], ['biceps']),
  ex('seated-cable-row', W, 'cable', ['upper_back', 'lats'], ['biceps']),
  ex('single-arm-cable-row', W, 'cable', ['lats'], ['biceps', 'upper_back']),
  ex('machine-row', W, 'machine', ['upper_back', 'lats'], ['biceps']),
  ex('lat-pulldown', W, 'cable', ['lats'], ['biceps', 'upper_back']),
  ex('close-grip-pulldown', W, 'cable', ['lats'], ['biceps']),
  ex('reverse-grip-pulldown', W, 'cable', ['lats', 'biceps']),
  ex('straight-arm-pulldown', W, 'cable', ['lats']),
  ex('pull-up', BW, 'bodyweight', ['lats'], ['biceps', 'upper_back']),
  ex('chin-up', BW, 'bodyweight', ['lats', 'biceps']),
  ex('neutral-grip-pull-up', BW, 'bodyweight', ['lats'], ['biceps', 'upper_back']),
  ex('weighted-pull-up', WBW, 'bodyweight', ['lats'], ['biceps', 'upper_back']),
  ex('weighted-chin-up', WBW, 'bodyweight', ['lats', 'biceps']),
  ex('assisted-pull-up', ABW, 'machine', ['lats'], ['biceps', 'upper_back']),
  ex('band-assisted-pull-up', ABW, 'band', ['lats'], ['biceps', 'upper_back']),
  ex('inverted-row', BW, 'bodyweight', ['upper_back', 'lats'], ['biceps']),
  ex('back-extension', BW, 'bodyweight', ['lower_back', 'glutes'], ['hamstrings']),
  ex('weighted-back-extension', WBW, 'plate', ['lower_back', 'glutes'], ['hamstrings']),

  // Nogi i pośladki
  ex('back-squat', W, 'barbell', ['quads', 'glutes'], ['adductors', 'lower_back']),
  ex('front-squat', W, 'barbell', ['quads'], ['glutes', 'abs']),
  ex('sumo-dumbbell-squat', W, 'dumbbell', ['quads', 'adductors', 'glutes']),
  ex('goblet-squat', W, 'dumbbell', ['quads', 'glutes']),
  ex('smith-squat', W, 'smith', ['quads', 'glutes']),
  ex('hack-squat', W, 'machine', ['quads'], ['glutes']),
  ex('leg-press', W, 'machine', ['quads', 'glutes'], ['hamstrings']),
  ex('bodyweight-squat', BW, 'bodyweight', ['quads', 'glutes']),
  ex('pistol-squat', BW, 'bodyweight', ['quads', 'glutes']),
  ex('bulgarian-split-squat', W, 'dumbbell', ['quads', 'glutes'], ['adductors']),
  ex('lunge', W, 'dumbbell', ['quads', 'glutes']),
  ex('walking-lunge', W, 'dumbbell', ['quads', 'glutes']),
  ex('barbell-lunge', W, 'barbell', ['quads', 'glutes']),
  ex('reverse-lunge', W, 'dumbbell', ['quads', 'glutes']),
  ex('step-up', W, 'dumbbell', ['quads', 'glutes']),
  ex('leg-extension', W, 'machine', ['quads']),
  ex('lying-leg-curl', W, 'machine', ['hamstrings']),
  ex('seated-leg-curl', W, 'machine', ['hamstrings']),
  ex('nordic-curl', BW, 'bodyweight', ['hamstrings']),
  ex('single-leg-romanian-deadlift', W, 'dumbbell', ['hamstrings', 'glutes']),
  ex('hip-thrust', W, 'barbell', ['glutes'], ['hamstrings']),
  ex('machine-hip-thrust', W, 'machine', ['glutes'], ['hamstrings']),
  ex('glute-bridge', BW, 'bodyweight', ['glutes'], ['hamstrings']),
  ex('cable-kickback', W, 'cable', ['glutes']),
  ex('hip-abduction', W, 'machine', ['abductors', 'glutes']),
  ex('hip-adduction', W, 'machine', ['adductors']),
  ex('kettlebell-swing', W, 'kettlebell', ['glutes', 'hamstrings'], ['lower_back']),
  ex('standing-calf-raise', W, 'machine', ['calves']),
  ex('seated-calf-raise', W, 'machine', ['calves']),
  ex('leg-press-calf-raise', W, 'machine', ['calves']),
  ex('dumbbell-calf-raise', W, 'dumbbell', ['calves']),

  // Ramiona
  ex('barbell-curl', W, 'barbell', ['biceps'], ['forearms']),
  ex('ez-bar-curl', W, 'ez_bar', ['biceps'], ['forearms']),
  ex('dumbbell-curl', W, 'dumbbell', ['biceps'], ['forearms']),
  ex('hammer-curl', W, 'dumbbell', ['biceps', 'forearms']),
  ex('incline-dumbbell-curl', W, 'dumbbell', ['biceps']),
  ex('preacher-curl', W, 'ez_bar', ['biceps']),
  ex('concentration-curl', W, 'dumbbell', ['biceps']),
  ex('cable-curl', W, 'cable', ['biceps']),
  ex('machine-curl', W, 'machine', ['biceps']),
  ex('reverse-curl', W, 'ez_bar', ['forearms', 'biceps']),
  ex('triceps-pushdown', W, 'cable', ['triceps']),
  ex('rope-pushdown', W, 'cable', ['triceps']),
  ex('overhead-cable-extension', W, 'cable', ['triceps']),
  ex('skull-crusher', W, 'ez_bar', ['triceps']),
  ex('overhead-dumbbell-extension', W, 'dumbbell', ['triceps']),
  ex('dumbbell-kickback', W, 'dumbbell', ['triceps']),
  ex('bench-dip', BW, 'bodyweight', ['triceps'], ['front_delts']),
  ex('machine-dip', W, 'machine', ['triceps'], ['chest']),
  ex('wrist-curl', W, 'dumbbell', ['forearms']),
  ex('reverse-wrist-curl', W, 'dumbbell', ['forearms']),
  ex('farmers-walk', T, 'dumbbell', ['forearms', 'traps'], ['abs']),
  ex('dead-hang', T, 'bodyweight', ['forearms'], ['lats']),

  // Brzuch
  ex('plank', T, 'bodyweight', ['abs'], ['obliques']),
  ex('side-plank', T, 'bodyweight', ['obliques'], ['abs']),
  ex('hollow-hold', T, 'bodyweight', ['abs']),
  ex('crunch', BW, 'bodyweight', ['abs']),
  ex('bicycle-crunch', BW, 'bodyweight', ['obliques', 'abs']),
  ex('decline-sit-up', BW, 'bodyweight', ['abs']),
  ex('cable-crunch', W, 'cable', ['abs']),
  ex('machine-crunch', W, 'machine', ['abs']),
  ex('hanging-leg-raise', BW, 'bodyweight', ['abs']),
  ex('hanging-knee-raise', BW, 'bodyweight', ['abs']),
  ex('lying-leg-raise', BW, 'bodyweight', ['abs']),
  ex('captains-chair-leg-raise', BW, 'bodyweight', ['abs']),
  ex('ab-wheel-rollout', BW, 'other', ['abs'], ['lats']),
  ex('russian-twist', BW, 'bodyweight', ['obliques']),
  ex('pallof-press', W, 'cable', ['obliques', 'abs']),
  ex('wood-chop', W, 'cable', ['obliques']),
  ex('dead-bug', BW, 'bodyweight', ['abs']),

  // Całe ciało i kondycja
  ex('power-clean', W, 'barbell', ['quads', 'glutes', 'traps'], ['hamstrings']),
  ex('thruster', W, 'dumbbell', ['quads', 'front_delts'], ['glutes', 'triceps']),
  ex('burpee', BW, 'bodyweight', ['quads', 'chest'], ['abs']),
  ex('box-jump', BW, 'bodyweight', ['quads', 'glutes'], ['calves']),
  ex('mountain-climber', T, 'bodyweight', ['abs'], ['quads']),
  ex('rowing-machine', T, 'machine', ['lats', 'quads'], ['upper_back']),
  ex('stationary-bike', T, 'machine', ['quads'], ['calves']),
  ex('treadmill', T, 'machine', ['quads', 'calves']),
  ex('jump-rope', T, 'other', ['calves'], ['quads']),
];
