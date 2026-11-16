// Własna klawiatura treningu: wpisywanie liczb jak w kalkulatorze, przecinek, kroki −/+ i limity.
// Czas wpisuje się cyframi jak w minutniku: „130” = 1:30, „45” = 0:45 („90” = 1:30 po przeliczeniu).
import { DEFAULT_WEIGHT_STEP_KG } from '../suggestion';
import { roundWeight } from '../units';

export type KeypadField = 'weight' | 'reps' | 'duration';
export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back';

const LIMITS: Record<KeypadField, number> = { weight: 999.99, reps: 999, duration: 5999 };
const STEPS: Record<KeypadField, number> = {
  weight: DEFAULT_WEIGHT_STEP_KG,
  reps: 1,
  duration: 5,
};
const MAX_DECIMALS = 2;
/** Najwięcej cyfr czasu: mm ss. */
const MAX_DURATION_DIGITS = 4;

/** Sekundy jako cyfry minutnika: 90 → „130”, 45 → „45”. */
function durationDigits(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return minutes > 0 ? `${minutes}${String(seconds).padStart(2, '0')}` : String(seconds);
}

/** Tekst w polu (z przecinkiem dziesiętnym). Pusty tekst = brak wartości. */
export function formatKeypadValue(value: number | null | undefined, field: KeypadField): string {
  if (value == null) return '';
  if (field === 'duration') return durationDigits(value);
  if (field !== 'weight') return String(Math.round(value));
  return String(roundWeight(value)).replace('.', ',');
}

/**
 * Przyjmuje i przecinek, i kropkę. Pusty albo niepoprawny tekst = null.
 * Czas: cyfry minutnika na sekundy (ostatnie dwie cyfry to sekundy, ponad 59 przeliczane).
 */
export function parseKeypadValue(text: string, field?: KeypadField): number | null {
  const normalized = text.replace(',', '.');
  if (normalized === '' || normalized === '.') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  if (field !== 'duration') return value;
  const digits = Math.floor(value);
  return Math.floor(digits / 100) * 60 + (digits % 100);
}

/** Tekst do pokazania: czas jako m:ss (także w trakcie wpisywania), reszta bez zmian. */
export function displayKeypadText(text: string, field: KeypadField): string {
  if (field !== 'duration' || text === '') return text;
  const digits = text.padStart(3, '0');
  const minutes = Number(digits.slice(0, -2));
  return `${minutes}:${digits.slice(-2)}`;
}

/**
 * Jedno naciśnięcie. `replace` = pierwsze naciśnięcie po wejściu w pole (cyfra zastępuje starą wartość,
 * jak w kalkulatorze). Klawisz, który dałby wartość spoza limitu, jest ignorowany.
 */
export function pressKey(
  text: string,
  key: KeypadKey,
  field: KeypadField,
  replace = false,
): string {
  if (key === 'back') return replace ? '' : text.slice(0, -1);

  const base = replace ? '' : text;
  if (key === ',') {
    if (field !== 'weight' || base.includes(',')) return text;
    return base === '' ? '0,' : `${base},`;
  }

  if (field === 'duration' && base.length >= MAX_DURATION_DIGITS) return text;
  const [, decimals] = base.split(',');
  if (decimals !== undefined && decimals.length >= MAX_DECIMALS) return text;
  const next = base === '0' ? key : `${base}${key}`;
  const value = parseKeypadValue(next, field);
  return value != null && value > LIMITS[field] ? text : next;
}

/** −/+ o krok (2,5 kg / 1 powt. / 5 s), nie mniej niż 0 i nie ponad limit. */
export function stepValue(
  value: number | null | undefined,
  direction: 1 | -1,
  field: KeypadField,
  stepKg: number = DEFAULT_WEIGHT_STEP_KG,
): number {
  const step = field === 'weight' ? stepKg : STEPS[field];
  const next = roundWeight((value ?? 0) + direction * step);
  return Math.min(LIMITS[field], Math.max(0, next));
}
