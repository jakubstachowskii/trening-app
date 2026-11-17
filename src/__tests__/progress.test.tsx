// Karta „Postępy”: pusty stan, Regularność, Historia miesiąca i szczegóły treningu.
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import ProgressScreen from '@/app/(tabs)/postepy/index';
import HistoryWorkoutScreen from '@/app/(tabs)/postepy/trening/[id]';
import type { Db } from '@/data/db';
import {
  addSet,
  addWorkoutExercise,
  finishWorkout,
  getWorkout,
  startWorkout,
} from '@/data/repositories/workouts';
import { t } from '@/i18n';

import { renderWithTheme, seededDb } from './helpers/screen';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
let mockParams: Record<string, string> = {};
let mockDb: Db;

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    get router() {
      return mockRouter;
    },
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
    Stack: { Screen: () => null },
  };
});
jest.mock('@/data/DatabaseProvider', () => ({ useDb: () => mockDb }));
// Potwierdzenie usunięcia: od razu „Usuń”.
jest.mock('@/components/stack', () => ({
  ...jest.requireActual('@/components/stack'),
  confirmDestructive: (_t: string, _b: string, _l: string, onConfirm: () => void) => onConfirm(),
}));

/** Zakończony trening dziś (`minutesAfterMidnight`): wyciskanie 2 serie `kg` × 8, 40 minut. */
async function finishedToday(name = 'Push', kg = 80, minutesAfterMidnight = 60) {
  const start = new Date();
  start.setHours(0, minutesAfterMidnight, 0, 0);
  const id = await startWorkout(mockDb, { name, startedAt: start.toISOString() });
  const we = await addWorkoutExercise(mockDb, id, 'bench-press');
  for (let i = 0; i < 2; i += 1) {
    await addSet(mockDb, we, { reps: 8, weightKg: kg, completedAt: start.toISOString() });
  }
  await finishWorkout(mockDb, id, new Date(start.getTime() + 40 * 60 * 1000).toISOString());
  return id;
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockDb = await seededDb();
});

describe('Postępy', () => {
  it('bez treningów: pusty stan z zachętą do pierwszego treningu', async () => {
    await renderWithTheme(<ProgressScreen />);
    expect(await screen.findByRole('header', { name: t('progress.emptyTitle') })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t('progress.emptyAction') })).toBeOnTheScreen();
  });

  it('Przegląd: Regularność z 12 tygodni; Historia: trening miesiąca z rekordem', async () => {
    // Rekord liczy się względem wcześniejszego treningu (pierwszy nie ma z czym porównać).
    await finishedToday('Rozgrzewka', 70, 10);
    const id = await finishedToday();
    await renderWithTheme(<ProgressScreen />);

    expect(await screen.findByText(t('progress.regularity'))).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Ostatnie 12 tygodni:/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: t('progress.history') }));
    // Po polsku 4 cyfry bez separatora tysięcy (1280).
    const row = await screen.findByRole('button', { name: /^Push, .* · 40:00 · 1280 kg$/ });
    expect(screen.getByLabelText('1 rekord')).toBeOnTheScreen();
    expect(screen.getByLabelText('Dni z treningiem w tym miesiącu: 1')).toBeOnTheScreen();

    await fireEvent.press(row);
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/postepy/trening/[id]',
      params: { id },
    });
  });
});

describe('trening z historii', () => {
  it('pokazuje nazwę, liczby i wszystkie serie', async () => {
    const id = await finishedToday('Pull');
    mockParams = { id };
    await renderWithTheme(<HistoryWorkoutScreen />);

    expect(await screen.findByRole('header', { name: 'Pull' })).toBeOnTheScreen();
    expect(screen.getByLabelText(`${t('progress.time')}: 40:00`)).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/^Seria \d, 80 × 8$/)).toHaveLength(2);
  });

  it('usunięty trening: „nie znaleziono” zamiast pustego ekranu', async () => {
    const id = await finishedToday();
    mockParams = { id };
    const { deleteWorkout } = jest.requireActual('@/data/repositories/workouts');
    await deleteWorkout(mockDb, id);
    await renderWithTheme(<HistoryWorkoutScreen />);
    expect(await screen.findByText(t('common.notFound'))).toBeOnTheScreen();
    await waitFor(async () => expect(await getWorkout(mockDb, id)).toBeNull());
  });
});
