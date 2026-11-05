import { getPalette } from './palette';
import { ACCENT_IDS, DEFAULT_ACCENT, tokens } from './tokens';

describe('getPalette', () => {
  it('domyślnym akcentem jest niebieski', () => {
    expect(DEFAULT_ACCENT).toBe('niebieski');
    expect(getPalette('dark').accent).toBe(tokens.color.accents.niebieski.dark.accent);
  });

  it('ciemny motyw ma czyste czarne tło', () => {
    expect(getPalette('dark').bg).toBe('#000000');
  });

  it('jest 5 akcentów do wyboru', () => {
    expect(ACCENT_IDS).toHaveLength(5);
  });

  it('jasny i ciemny motyw mają te same nazwy kolorów', () => {
    expect(Object.keys(tokens.color.light).sort()).toEqual(Object.keys(tokens.color.dark).sort());
  });

  it.each(ACCENT_IDS)('akcent %s ma komplet kolorów w obu motywach', (accent) => {
    for (const scheme of ['dark', 'light'] as const) {
      const palette = getPalette(scheme, accent);
      expect(palette.accent).toBeTruthy();
      expect(palette.accentText).toBeTruthy();
      expect(palette.accentSoft).toBeTruthy();
    }
  });
});
