import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as RN from 'react-native';

import { ThemeProvider, useTheme } from './ThemeProvider';
import { tokens } from './tokens';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

function mockScheme(scheme: RN.ColorSchemeName) {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(scheme);
}

afterEach(() => jest.restoreAllMocks());

describe('useTheme', () => {
  it('w ciemnym motywie systemu daje ciemne kolory i niebieski akcent', async () => {
    mockScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors.bg).toBe(tokens.color.dark.bg);
    expect(result.current.colors.accent).toBe(tokens.color.accents.niebieski.dark.accent);
  });

  it('w jasnym motywie systemu daje jasne kolory', async () => {
    mockScheme('light');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors.bg).toBe(tokens.color.light.bg);
  });

  it('bez informacji z systemu zostaje przy ciemnym', async () => {
    mockScheme('unspecified');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.scheme).toBe('dark');
  });

  it('podaje tokeny wymiarów i ruchu', async () => {
    mockScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.space.screen).toBe(tokens.space.screen);
    expect(result.current.size.touchMin).toBe(44);
    expect(result.current.reduceMotion).toBe(false);
  });

  it('bez ThemeProvider zgłasza czytelny błąd', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useTheme())).rejects.toThrow('ThemeProvider');
  });
});
