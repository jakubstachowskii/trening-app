// Motyw dla nawigacji (systemowe nagłówki stosów). Bez niego nawigacja przyjmuje jasny motyw
// i na iOS 26+ wymusza jasny styl paska: przyciski nagłówka w ciemnym motywie były jasnoszare.
import { DarkTheme, DefaultTheme } from 'expo-router';

import type { Palette } from './palette';
import type { ColorSchemeName } from './tokens';

export type NavigationTheme = typeof DefaultTheme;

export function navigationTheme(scheme: ColorSchemeName, colors: Palette): NavigationTheme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: colors.accentText,
      background: colors.bg,
      card: colors.bg,
      text: colors.label,
      border: colors.separator,
      notification: colors.danger,
    },
  };
}
