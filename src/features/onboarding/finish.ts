// Zakończenie wprowadzenia: zapis celu tygodnia, (opcjonalnie) wybór planu i znacznik „przeszedł”.
import { router } from 'expo-router';

import type { Db } from '@/data/db';
import { chooseProgram } from '@/data/repositories/plans';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import { markOnboardingDone, saveWeeklyGoal } from '@/features/settings/keys';
import { tMaybe } from '@/i18n';

export type OnboardingExit = 'choose' | 'other' | 'noPlan';

export async function finishOnboarding(
  db: Db,
  goal: number,
  exit: OnboardingExit,
  programId?: string,
  /** Uruchomione ponownie z „Pomóż mi wybrać” (karta Plan). */
  again = false,
): Promise<void> {
  await saveWeeklyGoal(db, goal);
  if (exit === 'choose' && programId) {
    const program = BUILTIN_PROGRAMS.find((p) => p.id === programId);
    if (program) await chooseProgram(db, program, (key) => tMaybe(key) ?? key);
  }
  await markOnboardingDone(db);
  // Zamyka oba ekrany wprowadzenia (pełny ekran nad kartami).
  router.dismissAll();
  // Po wyborze: pierwszy raz zostajemy na „Dziś” (pod spodem), ponownie — wracamy do karty Plan.
  if (exit === 'other') router.navigate('/plany/programy');
  else if (exit === 'choose' && again) router.navigate('/plany');
}

/** „Pomiń”: bez planu, z celem 3 — aplikacja nie wybiera planu za użytkownika. */
export async function skipOnboarding(db: Db, goal: number): Promise<void> {
  await saveWeeklyGoal(db, goal);
  await markOnboardingDone(db);
  router.dismissAll();
}
