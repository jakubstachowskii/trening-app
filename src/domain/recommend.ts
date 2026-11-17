// Który gotowy program polecić przy danym celu tygodnia (wprowadzenie i lista programów).
// Liczy się tygodniowa praca na partię mięśni: przy 2–3 treningach całe ciało daje każdej partii
// 2–3 treningi w tygodniu, przy 4 góra/dół — 2, przy 5–6 PPL — około 2 (docs/DECISIONS.md #26).
import { clampWeeklyGoal } from './week';

export type RecommendedProgramId = 'full-body-3' | 'upper-lower-4' | 'push-pull-legs';

export function recommendProgram(weeklyGoal: number): RecommendedProgramId {
  const goal = clampWeeklyGoal(weeklyGoal);
  if (goal <= 3) return 'full-body-3';
  if (goal === 4) return 'upper-lower-4';
  return 'push-pull-legs';
}
