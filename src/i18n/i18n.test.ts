import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { t, translate } from './index';
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
