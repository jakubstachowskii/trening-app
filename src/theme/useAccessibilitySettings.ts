import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type Flag = 'reduceMotion' | 'reduceTransparency';

const SOURCES = {
  reduceMotion: {
    read: () => AccessibilityInfo.isReduceMotionEnabled(),
    event: 'reduceMotionChanged',
  },
  reduceTransparency: {
    read: () => AccessibilityInfo.isReduceTransparencyEnabled(),
    event: 'reduceTransparencyChanged',
  },
} as const;

function useAccessibilityFlag(flag: Flag): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const { read, event } = SOURCES[flag];
    let active = true;
    // Nie każda platforma ma każdą funkcję (np. web nie zna Reduce Transparency) — wtedy zostaje false.
    Promise.resolve()
      .then(read)
      .then((value) => active && setEnabled(value))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(event, setEnabled);
    return () => {
      active = false;
      subscription.remove();
    };
  }, [flag]);

  return enabled;
}

/** Ustawienia systemowe iOS: Ogranicz ruch i Zmniejsz przezroczystość. */
export function useAccessibilitySettings() {
  return {
    reduceMotion: useAccessibilityFlag('reduceMotion'),
    reduceTransparency: useAccessibilityFlag('reduceTransparency'),
  };
}
