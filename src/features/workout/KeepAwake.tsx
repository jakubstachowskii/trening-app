import { useKeepAwake } from 'expo-keep-awake';

/** Ekran nie gaśnie, dopóki ten element jest na ekranie (trening w toku). */
export function KeepAwake() {
  useKeepAwake('workout');
  return null;
}
