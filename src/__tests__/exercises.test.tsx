import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import ExerciseScreen from '@/app/(tabs)/cwiczenia/[id]';
import ExercisesScreen from '@/app/(tabs)/cwiczenia/index';
import CustomExerciseSheet from '@/app/(tabs)/cwiczenia/nowe';
import type { Db } from '@/data/db';
import { listExercises } from '@/data/repositories/exercises';
import { ExerciseFiltersProvider } from '@/features/exercises/FiltersContext';
import { t, tList } from '@/i18n';

import { renderWithTheme, seededDb } from './helpers/screen';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
let mockParams: Record<string, string> = {};
let mockDb: Db;

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
    Stack: { Screen: () => null },
  };
});
jest.mock('@/data/DatabaseProvider', () => ({ useDb: () => mockDb }));

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockDb = await seededDb();
});

describe('lista ćwiczeń', () => {
  it('pokazuje gotowe ćwiczenia w sekcjach i przycisk filtrów', async () => {
    await renderWithTheme(
      <ExerciseFiltersProvider>
        <ExercisesScreen />
      </ExerciseFiltersProvider>,
    );
    expect(await screen.findByRole('button', { name: /^Bieżnia,/ })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'B' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('exerciseList.filters') }));
    expect(mockRouter.push).toHaveBeenCalledWith('/cwiczenia/filtry');
  });
});

describe('szczegóły ćwiczenia', () => {
  it('pokazuje nazwę, opis wykonania i puste kafelki bez historii', async () => {
    mockParams = { id: 'bench-press' };
    await renderWithTheme(<ExerciseScreen />);

    expect(
      await screen.findByRole('header', { name: 'Wyciskanie sztangi na ławce poziomej' }),
    ).toBeOnTheScreen();
    expect(screen.getByText(tList('exerciseGuides.bench-press.steps')[0])).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`${t('exercise.oneRepMax')}: ${t('exercise.noData')}`),
    ).toBeOnTheScreen();
  });

  it('zakładka Historia pokazuje pusty stan, a przycisk prowadzi do dodania do planu', async () => {
    mockParams = { id: 'bench-press' };
    await renderWithTheme(<ExerciseScreen />);
    await screen.findByRole('header', { name: 'Wyciskanie sztangi na ławce poziomej' });

    await fireEvent.press(screen.getByRole('tab', { name: t('exercise.tabHistory') }));
    expect(await screen.findByText(t('exercise.historyEmptyTitle'))).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('exercise.addToPlan') }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/cwiczenia/dodaj',
      params: { exerciseId: 'bench-press' },
    });
  });
});

describe('własne ćwiczenie', () => {
  it('bez nazwy i mięśni pokazuje błędy i nic nie zapisuje', async () => {
    await renderWithTheme(<CustomExerciseSheet />);
    const save = await screen.findByRole('button', { name: t('common.save') });
    await fireEvent.press(save);

    expect(screen.getByText(t('customExercise.nameRequired'))).toBeOnTheScreen();
    expect(screen.getByText(t('customExercise.primaryRequired'))).toBeOnTheScreen();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('zapisuje ćwiczenie z nazwą, mięśniem i sprzętem', async () => {
    await renderWithTheme(<CustomExerciseSheet />);
    await fireEvent.changeText(
      await screen.findByLabelText(t('customExercise.name')),
      'Wyciskanie na maszynie Hammer',
    );
    await fireEvent.press(screen.getAllByRole('togglebutton', { name: t('muscles.chest') })[0]);
    await fireEvent.press(screen.getByRole('togglebutton', { name: t('equipment.machine') }));
    await fireEvent.press(screen.getByRole('button', { name: t('common.save') }));

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    const custom = (await listExercises(mockDb)).filter((e) => e.source === 'user');
    expect(custom).toEqual([
      expect.objectContaining({
        name: 'Wyciskanie na maszynie Hammer',
        primaryMuscles: ['chest'],
        equipment: 'machine',
      }),
    ]);
  });
});
