// Teksty dat na ekranie „Dziś”: nagłówek z datą, litery dni i „kiedy” przy ostatnim rekordzie.
import { t } from '@/i18n';

const DAY_MS = 24 * 3600 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** „Czwartek, 19 listopada”. */
export function formatTodayDate(date: Date): string {
  const text = date.toLocaleDateString('pl', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Pierwsza litera dnia tygodnia (P, W, Ś…). */
export function dayInitial(date: Date): string {
  return t('today.dayInitials').split(',')[date.getDay()] ?? '';
}

/** Pełna nazwa dnia do VoiceOver („czwartek, 19 listopada”). */
export function dayName(date: Date): string {
  return date.toLocaleDateString('pl', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** „jutro”, „w środę” (w ciągu tygodnia), dalej „24 listopada”. */
export function formatNext(iso: string, now: Date): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
  if (days <= 0) return t('today.today');
  if (days === 1) return t('today.tomorrow');
  if (days < 7) return t('today.onWeekday').split(',')[date.getDay()] ?? '';
  return date.toLocaleDateString('pl', { day: 'numeric', month: 'long' });
}

/** „dziś”, „wczoraj”, „w poniedziałek” (do 6 dni wstecz), dalej „12 listopada”. */
export function formatWhen(iso: string, now: Date): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return t('today.today');
  if (days === 1) return t('today.yesterday');
  if (days < 7) return t('today.onWeekday').split(',')[date.getDay()] ?? '';
  return date.toLocaleDateString('pl', { day: 'numeric', month: 'long' });
}
