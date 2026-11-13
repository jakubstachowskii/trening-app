import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  formatNumber,
  interpolate,
  pluralFormPl,
  t,
  tList,
  tMaybe,
  tPlural,
  translate,
} from './index';
import pl from './locales/pl.json';

function keys(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    keys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('tłumaczenia', () => {
  it('każdy tekst po polsku jest niepusty', () => {
    for (const key of keys(pl)) {
      expect(translate(pl, key)?.trim()).toBeTruthy();
    }
  });

  it('każdy kolejny język ma dokładnie te same klucze co polski', () => {
    const dir = join(__dirname, 'locales');
    const reference = keys(pl).sort();
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
      const messages = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      expect({ file, keys: keys(messages).sort() }).toEqual({ file, keys: reference });
    }
  });

  it('t() zwraca tekst dla klucza', () => {
    expect(t('tabs.exercises')).toBe('Ćwiczenia');
  });

  it('translate() zwraca undefined dla nieistniejącego klucza', () => {
    expect(translate(pl, 'nie.ma.takiego')).toBeUndefined();
  });
});

describe('odmiana i parametry', () => {
  it.each([
    [1, 'one'],
    [2, 'few'],
    [4, 'few'],
    [5, 'many'],
    [11, 'many'],
    [12, 'many'],
    [14, 'many'],
    [21, 'many'],
    [22, 'few'],
    [104, 'few'],
    [112, 'many'],
    [0, 'many'],
    [2.5, 'few'],
  ])('pluralFormPl(%p) = %s', (count, form) => {
    expect(pluralFormPl(count)).toBe(form);
  });

  it('tPlural() odmienia i wstawia liczbę', () => {
    expect(tPlural('units.sets', 1)).toBe('1 seria');
    expect(tPlural('units.sets', 3)).toBe('3 serie');
    expect(tPlural('units.sets', 5)).toBe('5 serii');
    expect(tPlural('units.exercises', 22)).toBe('22 ćwiczenia');
  });

  it('t() podstawia parametry, a brakujący zostawia', () => {
    expect(t('units.kg', { value: '82,5' })).toBe('82,5 kg');
    expect(interpolate('{a} i {b}', { a: 1 })).toBe('1 i {b}');
  });

  it('formatNumber() używa przecinka i obcina zbędne zera', () => {
    expect(formatNumber(82.5)).toBe('82,5');
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(1250)).toBe('1250');
  });

  it('tList() dzieli tekst na linie i pomija puste', () => {
    expect(tList('nie.ma.takiego')).toEqual([]);
  });

  it('tMaybe() zwraca undefined dla brakującego klucza', () => {
    expect(tMaybe('exercises.nie-ma')).toBeUndefined();
    expect(tMaybe('exercises.bench-press')).toBe('Wyciskanie sztangi na ławce poziomej');
  });
});
