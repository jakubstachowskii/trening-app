// Jedno źródło prawdy: design/tokens.json (docs/DESIGN.md). Tu tylko typowany dostęp.
import raw from '../../design/tokens.json';

export const tokens = raw;

export type ColorSchemeName = 'light' | 'dark';

type Accents = typeof tokens.color.accents;
export type AccentId = Exclude<keyof Accents, 'default'>;

export const ACCENT_IDS = Object.keys(tokens.color.accents).filter(
  (id) => id !== 'default',
) as AccentId[];

export const DEFAULT_ACCENT = tokens.color.accents.default as AccentId;

export type FontVariant = keyof typeof tokens.font.scale;
