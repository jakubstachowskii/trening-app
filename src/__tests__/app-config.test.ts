import { tokens } from '@/theme';

import app from '../../app.json';

type SplashOptions = { backgroundColor: string; dark: { backgroundColor: string } };

// app.json nie może czytać tokenów, więc test pilnuje, żeby kolory ekranu startowego się zgadzały.
describe('app.json', () => {
  const entry = app.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );
  const splash = (entry as [string, SplashOptions] | undefined)?.[1];

  it('ekran startowy ma tło z tokenów w obu motywach', () => {
    expect(splash?.backgroundColor).toBe(tokens.color.light.bg);
    expect(splash?.dark.backgroundColor).toBe(tokens.color.dark.bg);
  });

  it('aplikacja podąża za motywem systemu', () => {
    expect(app.expo.userInterfaceStyle).toBe('automatic');
  });
});
