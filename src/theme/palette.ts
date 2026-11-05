import { type AccentId, type ColorSchemeName, DEFAULT_ACCENT, tokens } from './tokens';

type BaseColors = typeof tokens.color.dark;
type AccentColors = typeof tokens.color.accents.niebieski.dark;

export type Palette = BaseColors & AccentColors;
export type ColorName = keyof Palette;

/** Kolory motywu (jasny/ciemny) połączone z wybranym akcentem. */
export function getPalette(scheme: ColorSchemeName, accent: AccentId = DEFAULT_ACCENT): Palette {
  return { ...tokens.color[scheme], ...tokens.color.accents[accent][scheme] };
}
