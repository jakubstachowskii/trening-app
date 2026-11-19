// Ustawienia aplikacji w tabeli `setting` (klucz → JSON). Jedno miejsce na klucze i wartości domyślne.
import type { Db } from '@/data/db';
import { getPlan, listPlans } from '@/data/repositories/plans';
import { getSetting, setSetting } from '@/data/repositories/settings';
import { DEFAULT_WEIGHT_STEP_KG } from '@/domain/suggestion';
import { clampWeeklyGoal, effectiveWeeklyGoal } from '@/domain/week';
import { DEFAULT_REST_SEC, MAX_REST_SEC } from '@/domain/workout/restTimer';

export const SETTING = {
  /** Cel tygodnia (2–6). Brak wartości = nigdy nie ustawiony (pierścień liczy wtedy treningi planu). */
  weeklyGoal: 'weeklyGoal',
  restDefaultSec: 'restDefaultSec',
  weightStepKg: 'weightStepKg',
  keepAwake: 'keepAwake',
  onboardingDone: 'onboardingDone',
} as const;

/** Kroki ciężaru do wyboru w Ustawieniach. */
export const WEIGHT_STEPS_KG = [1, 1.25, 2.5, 5] as const;
export const REST_MIN_SEC = 30;
export const REST_MAX_SEC = 5 * 60;
/** Domyślna przerwa do wyboru w Ustawieniach. */
export const REST_OPTIONS_SEC = [45, 60, 90, 120, 150, 180, 240, 300] as const;

export type TrainingSettings = {
  weeklyGoal: number | null;
  restDefaultSec: number;
  weightStepKg: number;
  keepAwake: boolean;
};

function clampRest(sec: unknown): number {
  const n = Number(sec);
  if (!Number.isFinite(n)) return DEFAULT_REST_SEC;
  return Math.min(Math.min(REST_MAX_SEC, MAX_REST_SEC), Math.max(REST_MIN_SEC, Math.round(n)));
}

function validStep(kg: unknown): number {
  return WEIGHT_STEPS_KG.find((s) => s === Number(kg)) ?? DEFAULT_WEIGHT_STEP_KG;
}

export async function loadTrainingSettings(db: Db): Promise<TrainingSettings> {
  const goal = await getSetting<number | null>(db, SETTING.weeklyGoal, null);
  return {
    weeklyGoal: goal == null ? null : clampWeeklyGoal(goal),
    restDefaultSec: clampRest(await getSetting(db, SETTING.restDefaultSec, DEFAULT_REST_SEC)),
    weightStepKg: validStep(await getSetting(db, SETTING.weightStepKg, DEFAULT_WEIGHT_STEP_KG)),
    keepAwake: (await getSetting(db, SETTING.keepAwake, true)) !== false,
  };
}

/** Cel tygodnia do pokazania: zapisany albo liczba treningów aktywnego planu (jak pierścień). */
export async function loadWeeklyGoal(db: Db): Promise<number> {
  const saved = (await loadTrainingSettings(db)).weeklyGoal;
  if (saved != null) return saved;
  const active = (await listPlans(db)).find((p) => p.isActive);
  const plan = active ? await getPlan(db, active.id) : null;
  return effectiveWeeklyGoal(null, plan ? plan.days.length : null);
}

export function saveWeeklyGoal(db: Db, goal: number): Promise<void> {
  return setSetting(db, SETTING.weeklyGoal, clampWeeklyGoal(goal));
}

export function saveRestDefault(db: Db, sec: number): Promise<void> {
  return setSetting(db, SETTING.restDefaultSec, clampRest(sec));
}

export function saveWeightStep(db: Db, kg: number): Promise<void> {
  return setSetting(db, SETTING.weightStepKg, validStep(kg));
}

export function saveKeepAwake(db: Db, on: boolean): Promise<void> {
  return setSetting(db, SETTING.keepAwake, on);
}

export async function isOnboardingDone(db: Db): Promise<boolean> {
  return (await getSetting(db, SETTING.onboardingDone, false)) === true;
}

export function markOnboardingDone(db: Db): Promise<void> {
  return setSetting(db, SETTING.onboardingDone, true);
}
