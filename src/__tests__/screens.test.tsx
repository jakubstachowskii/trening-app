import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import HistoriaScreen from '@/app/historia';
import StartScreen from '@/app/index';
import PostepyScreen from '@/app/postepy';
import { t } from '@/i18n';
import { ThemeProvider } from '@/theme';

// Karty, które w F5 są jeszcze puste. Ćwiczenia i Plany: src/__tests__/exercises.test.tsx, plans.test.tsx.
type ScreenKey = 'start' | 'progress' | 'history';

const SCREENS: [ScreenKey, ComponentType][] = [
  ['start', StartScreen],
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
