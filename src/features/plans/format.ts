// Krótkie opisy ćwiczeń w planie: „3 × 8–12 · przerwa 2 min”. Czyste funkcje.
import type { PlanExercise } from '@/data/models';
import { formatNumber, t } from '@/i18n';

type Target = Pick<
  PlanExercise,
  'targetSets' | 'repsMin' | 'repsMax' | 'targetDurationSec' | 'targetWeightKg'
>;

/** „8–12”, „5”, „8+” albo „do 12”; bez danych pusty tekst. */
export function formatRepRange(min: number | null, max: number | null): string {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (min != null) return t('plan.repsAtLeast', { min });
  if (max != null) return t('plan.repsUpTo', { max });
  return '';
}

/** Czas: „45 s”, „1 min”, „1 min 30 s”. */
export function formatDuration(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return t('units.seconds', { value: seconds });
  if (seconds === 0) return t('units.minutes', { value: minutes });
  return `${t('units.minutes', { value: minutes })} ${t('units.seconds', { value: seconds })}`;
}

/** „3 × 8–12”, „3 × 45 s”, „4 × 5 · 80 kg”. */
export function formatTarget(target: Target): string {
  const amount =
    target.targetDurationSec != null
      ? formatDuration(target.targetDurationSec)
      : formatRepRange(target.repsMin, target.repsMax);
  const base = amount ? `${target.targetSets} × ${amount}` : `${target.targetSets} ×`;
  return target.targetWeightKg != null
    ? `${base} · ${t('units.kg', { value: formatNumber(target.targetWeightKg) })}`
    : base;
}

/** „3 × 8–12 · przerwa 2 min” (bez przerwy, gdy nie ustawiona). */
export function formatPlanExercise(item: Target & Pick<PlanExercise, 'restSec'>): string {
  const target = formatTarget(item);
  return item.restSec
    ? `${target} · ${t('plan.restShort', { value: formatDuration(item.restSec) })}`
    : target;
}
