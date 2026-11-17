import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import HistoriaScreen from '@/app/(tabs)/historia';
import PostepyScreen from '@/app/(tabs)/postepy';
import { t } from '@/i18n';
import { ThemeProvider } from '@/theme';

// Karty, które są jeszcze puste. Start i trening: workout.test.tsx; Ćwiczenia i Plany: osobne pliki.
type ScreenKey = 'progress' | 'history';

const SCREENS: [ScreenKey, ComponentType][] = [
  ['progress', PostepyScreen],
  ['history', HistoriaScreen],
];

describe.each(SCREENS)('ekran %s', (key, Component) => {
  beforeEach(async () => {
    await render(
      <ThemeProvider>
        <Component />
      </ThemeProvider>,
    );
  });

  it('ma tytuł jako nagłówek dla VoiceOver', () => {
    expect(screen.getByRole('header', { name: t(`screens.${key}.title`) })).toBeOnTheScreen();
  });

  it('pokazuje opis z pliku tłumaczeń', () => {
    expect(screen.getByText(t(`screens.${key}.body`))).toBeOnTheScreen();
  });
});
