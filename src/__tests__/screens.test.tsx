import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import CwiczeniaScreen from '@/app/cwiczenia';
import HistoriaScreen from '@/app/historia';
import StartScreen from '@/app/index';
import PlanyScreen from '@/app/plany';
import PostepyScreen from '@/app/postepy';
import { t } from '@/i18n';
import { ThemeProvider } from '@/theme';

type ScreenKey = 'start' | 'plans' | 'exercises' | 'progress' | 'history';

const SCREENS: [ScreenKey, ComponentType][] = [
  ['start', StartScreen],
  ['plans', PlanyScreen],
  ['exercises', CwiczeniaScreen],
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
