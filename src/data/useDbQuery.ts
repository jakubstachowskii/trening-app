// Odczyt z bazy w ekranach: dane, stan ładowania i błąd. Odświeża się po powrocie na ekran,
// więc lista widzi zmiany zrobione na innym ekranie (np. w arkuszu edycji).
import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { Db } from './db';
import { useDb } from './DatabaseProvider';

export type QueryState<T> = {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => Promise<void>;
};

/** `key` opisuje, od czego zależy zapytanie (np. id ćwiczenia); zmiana klucza = nowe zapytanie. */
export function useDbQuery<T>(query: (db: Db) => Promise<T>, key: string): QueryState<T> {
  const db = useDb();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const queryRef = useRef(query);
  useLayoutEffect(() => {
    queryRef.current = query;
  });

  const reload = useCallback(async () => {
    const id = ++latest.current;
    try {
      const result = await queryRef.current(db);
      if (id === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (cause) {
      if (id === latest.current)
        setError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      if (id === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- klucz zastępuje zależności zapytania
  }, [db, key]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, loading, reload };
}
