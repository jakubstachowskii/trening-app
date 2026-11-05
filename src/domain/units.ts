/** Dokładność zapisu ciężaru: 0,001 kg wystarcza dla każdej talerzowej kombinacji. */
const WEIGHT_PRECISION = 1000;

export function roundWeight(kg: number): number {
  return Math.round(kg * WEIGHT_PRECISION) / WEIGHT_PRECISION;
}

/** Zaokrągla do najbliższego kroku (np. 2,5 kg), bez śmieci zmiennoprzecinkowych. */
export function roundToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  return roundWeight(Math.round(value / step) * step);
}
