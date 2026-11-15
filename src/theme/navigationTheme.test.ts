import { navigationTheme } from './navigationTheme';
import { getPalette } from './palette';

describe('motyw nawigacji', () => {
  it('ciemny motyw aplikacji = ciemna nawigacja (nagłówek iOS bierze z tego styl)', () => {
    const colors = getPalette('dark');
    const theme = navigationTheme('dark', colors);
    expect(theme.dark).toBe(true);
    expect(theme.colors).toMatchObject({
      primary: colors.accentText,
      background: colors.bg,
      card: colors.bg,
      text: colors.label,
    });
  });

  it('jasny motyw aplikacji = jasna nawigacja', () => {
    const colors = getPalette('light', 'pomarancz');
    const theme = navigationTheme('light', colors);
    expect(theme.dark).toBe(false);
    expect(theme.colors.primary).toBe(colors.accentText);
  });
});
