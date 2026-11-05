import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { getPalette, type Palette } from './palette';
import { type AccentId, type ColorSchemeName, DEFAULT_ACCENT, tokens } from './tokens';
import { useAccessibilitySettings } from './useAccessibilitySettings';

export type Theme = {
  scheme: ColorSchemeName;
  accent: AccentId;
  colors: Palette;
  font: typeof tokens.font.scale;
  space: typeof tokens.space;
  radius: typeof tokens.radius;
  size: typeof tokens.size;
  motion: typeof tokens.motion;
  reduceMotion: boolean;
  reduceTransparency: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

type Props = {
  children: ReactNode;
  /** Wybór akcentu w ustawieniach przyjdzie w F8; do tego czasu domyślny. */
  accent?: AccentId;
};

export function ThemeProvider({ children, accent = DEFAULT_ACCENT }: Props) {
  const system = useColorScheme();
  // Gdy system nie podaje motywu, zostajemy przy ciemnym (motyw główny projektu).
  const scheme: ColorSchemeName = system === 'light' ? 'light' : 'dark';
  const { reduceMotion, reduceTransparency } = useAccessibilitySettings();

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      accent,
      colors: getPalette(scheme, accent),
      font: tokens.font.scale,
      space: tokens.space,
      radius: tokens.radius,
      size: tokens.size,
      motion: tokens.motion,
      reduceMotion,
      reduceTransparency,
    }),
    [scheme, accent, reduceMotion, reduceTransparency],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme() wymaga <ThemeProvider> wyżej w drzewie.');
  }
  return theme;
}
