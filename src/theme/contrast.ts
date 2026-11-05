// Kontrast WCAG 2.1 dla par kolorów z palety (ta sama logika co design/check-contrast.js).
import type { ColorName, Palette } from './palette';

type Rgb = [number, number, number];

function parse(color: string): number[] {
  if (color.startsWith('#')) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  }
  return (color.match(/[\d.]+/g) ?? []).map(Number);
}

/** Kolor z przezroczystością nałożony na tło — tak, jak widzi go oko. */
function blend(fg: string, bg: string): Rgb {
  const f = parse(fg);
  const b = parse(bg);
  const alpha = f[3] ?? 1;
  return [0, 1, 2].map((i) => Math.round(f[i] * alpha + b[i] * (1 - alpha))) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb
    .map((x) => x / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(blend(fg, bg));
  const b = luminance(parse(bg).slice(0, 3) as Rgb);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** [pierwszy plan, tło, minimum] — tekst 4,5:1, elementy graficzne 3:1. */
export const CONTRAST_CHECKS: [ColorName, ColorName, number][] = [
  ['label', 'surface', 4.5],
  ['label', 'selected', 4.5],
  ['label2', 'surface', 4.5],
  ['label2', 'fill', 4.5],
  ['label2', 'bg', 4.5],
  ['accentText', 'surface', 4.5],
  ['accentText', 'bg', 4.5],
  ['onAccent', 'accent', 4.5],
  ['accent', 'surface', 3],
  ['accent', 'bg', 3],
  ['success', 'surface', 3],
  ['warning', 'surface', 3],
  ['danger', 'surface', 4.5],
];

export function failedContrastChecks(palette: Palette): string[] {
  return CONTRAST_CHECKS.filter(
    ([fg, bg, min]) => contrastRatio(palette[fg], palette[bg]) < min,
  ).map(([fg, bg, min]) => `${fg}/${bg} < ${min}`);
}
