import { contrastRatio, failedContrastChecks } from './contrast';
import { getPalette } from './palette';
import { ACCENT_IDS } from './tokens';

describe('contrastRatio', () => {
  it('daje 21:1 dla czerni na bieli i 1:1 dla tego samego koloru', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('uwzględnia przezroczystość koloru na tle', () => {
    expect(contrastRatio('rgba(0,0,0,0)', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('rgba(0,0,0,1)', '#FFFFFF')).toBeCloseTo(21, 1);
  });
});

describe.each(['dark', 'light'] as const)('motyw %s', (scheme) => {
  it.each(ACCENT_IDS)('akcent %s spełnia wszystkie progi kontrastu', (accent) => {
    expect(failedContrastChecks(getPalette(scheme, accent))).toEqual([]);
  });
});
