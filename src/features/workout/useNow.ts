import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Bieżący czas odświeżany co `intervalMs` i od razu po powrocie aplikacji z tła. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs, enabled]);
  return now;
}
