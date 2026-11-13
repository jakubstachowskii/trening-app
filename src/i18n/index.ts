// Teksty interfejsu. Domyślny i na razie jedyny język: polski.
// Bez biblioteki, dopóki nie dojdzie drugi język (docs/DECISIONS.md).
import pl from './locales/pl.json';

type Messages = typeof pl;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

/** Klucz z odmianą: obiekt z polami `one`, `few`, `many` (np. `units.sets`). */
export type PluralKey = MessageKey extends infer K
  ? K extends `${infer Base}.one`
    ? Base
    : never
  : never;

export type Params = Record<string, string | number>;

export const locales = { pl } as const;
export type Locale = keyof typeof locales;
export const DEFAULT_LOCALE: Locale = 'pl';

export function translate(messages: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      messages,
    );
  return typeof value === 'string' ? value : undefined;
}

/** Podstawia `{nazwa}` wartościami z `params`. Brakujący parametr zostaje jak jest. */
export function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type PluralForm = 'one' | 'few' | 'many';

/**
 * Polska odmiana liczebników: 1 seria, 2–4 serie (ale 12–14 serii), 5+ serii.
 * Ułamki („2,5”) odmieniają się jak „few”/„many” niejednoznacznie, więc dostają „few”
 * (np. „2,5 minuty”), co brzmi naturalnie dla jednostek w aplikacji.
 */
export function pluralFormPl(count: number): PluralForm {
  const n = Math.abs(count);
  if (!Number.isInteger(n)) return 'few';
  if (n === 1) return 'one';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'few';
  return 'many';
}

export function t(key: MessageKey, params?: Params, locale: Locale = DEFAULT_LOCALE): string {
  return interpolate(translate(locales[locale], key) ?? key, params);
}

/**
 * Klucz składany w czasie działania (np. `exercises.<id>`), którego TypeScript nie sprawdzi.
 * Brak tekstu → `undefined`, żeby ekran mógł pokazać zastępczy tekst.
 */
export function tMaybe(key: string, params?: Params, locale: Locale = DEFAULT_LOCALE) {
  const text = translate(locales[locale], key);
  return text === undefined ? undefined : interpolate(text, params);
}

/** Tekst z odmianą: `tPlural('units.sets', 3)` → „3 serie”. `{count}` dostaje liczbę. */
export function tPlural(
  key: PluralKey,
  count: number,
  params?: Params,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const form = pluralFormPl(count);
  const text = translate(locales[locale], `${key}.${form}`) ?? key;
  return interpolate(text, { count: formatNumber(count, locale), ...params });
}

/** Lista punktów zapisana w jednym tekście, po jednym w linii (np. kroki wykonania ćwiczenia). */
export function tList(key: string, locale: Locale = DEFAULT_LOCALE): string[] {
  const text = translate(locales[locale], key);
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Liczba po polsku: przecinek dziesiętny, bez zbędnych zer („2,5”, „100”). */
export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    value,
  );
}
