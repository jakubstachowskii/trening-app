// Teksty interfejsu. Domyślny i na razie jedyny język: polski.
// Bez biblioteki, dopóki nie dojdzie drugi język (docs/DECISIONS.md).
import pl from './locales/pl.json';

type Messages = typeof pl;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

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

export function t(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  return translate(locales[locale], key) ?? key;
}
