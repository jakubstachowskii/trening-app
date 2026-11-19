import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import StartScreen from '@/app/(tabs)/index';
import WorkoutScreen from '@/app/trening/index';
import WorkoutSummaryScreen from '@/app/trening/podsumowanie';
import type { Db } from '@/data/db';
import {
  addPlanDay,
  addPlanExercise,
  createPlan,
  setActivePlan,
  setPlanWeekdays,
} from '@/data/repositories/plans';
import { mondayIndex } from '@/domain/week';
import { getSetting, setSetting } from '@/data/repositories/settings';
import {
  completeWorkout,
  getUnfinishedWorkout,
  getWorkout,
  listWorkouts,
  startWorkoutFromDay,
  updateSet,
} from '@/data/repositories/workouts';
import { REST_SETTING } from '@/features/workout/restStore';
import { SETTING } from '@/features/settings/keys';
import { t } from '@/i18n';

import { renderWithTheme, seededDb } from './helpers/screen';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  canGoBack: () => true,
};
let mockParams: Record<string, string> = {};
let mockDb: Db;

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    get router() {
      return mockRouter;
    },
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
    Stack: { Screen: () => null },
  };
});
jest.mock('@/data/DatabaseProvider', () => ({ useDb: () => mockDb }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => 'notification-1'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

async function activePlan() {
  const planId = await createPlan(mockDb, { name: 'Mój plan' });
  const dayId = await addPlanDay(mockDb, planId, 'Push A');
  await addPlanExercise(mockDb, dayId, {
    exerciseId: 'bench-press',
    targetSets: 2,
    repsMin: 8,
    repsMax: 10,
    targetWeightKg: 60,
    targetDurationSec: null,
    restSec: 90,
    note: null,
  });
  await setActivePlan(mockDb, planId);
  return { planId, dayId };
}

/** Zakończony trening dnia planu ze wszystkimi seriami odhaczonymi (ciężar opcjonalnie zmieniony). */
async function finishedWorkout(dayId: string, startedAt: string, weightKg?: number) {
  const id = await startWorkoutFromDay(mockDb, dayId, { startedAt });
  const workout = await getWorkout(mockDb, id);
  for (const set of workout!.exercises[0].sets) {
    await updateSet(mockDb, set.id, {
      ...set,
      weightKg: weightKg ?? set.weightKg,
      reps: 10,
      completedAt: startedAt,
    });
  }
  await completeWorkout(mockDb, id, new Date(Date.parse(startedAt) + 3600_000).toISOString());
  return id;
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockDb = await seededDb();
});

describe('Dziś', () => {
  it('bez planu: cel tygodnia −/+ i pusty trening', async () => {
    await renderWithTheme(<StartScreen />);
    expect(await screen.findByText(t('today.goalTitle'))).toBeOnTheScreen();
    expect(screen.getByLabelText(t('today.goalValue', { count: 3 }))).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('today.goalMore') }));
    await waitFor(async () => expect(await getSetting(mockDb, SETTING.weeklyGoal, 0)).toBe(4));
    expect(await screen.findByLabelText(t('today.goalValue', { count: 4 }))).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('today.startEmpty') }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/trening'));
    expect(await getUnfinishedWorkout(mockDb)).not.toBeNull();
  });

  it('następny trening z aktywnego planu i start jednym przyciskiem', async () => {
    const { dayId } = await activePlan();
    await renderWithTheme(<StartScreen />);
    expect(await screen.findByRole('header', { name: 'Push A' })).toBeOnTheScreen();
    // Plan ma 1 dzień, więc pierścień ma 1 segment.
    expect(screen.getByText(t('today.ofWeek', { n: 1, total: 1 }))).toBeOnTheScreen();
    expect(screen.getByText(t('today.streak'))).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: t('today.startLabel', { name: 'Push A' }) }),
    );
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/trening'));
    expect((await getUnfinishedWorkout(mockDb))?.planDayId).toBe(dayId);
  });

  it('dni treningowe: dzień wolny i dni zaplanowane w pasku', async () => {
    const { planId } = await activePlan();
    const today = mondayIndex(new Date());
    const tomorrow = (today + 1) % 7;
    await setPlanWeekdays(mockDb, planId, [tomorrow]);
    await renderWithTheme(<StartScreen />);

    expect(
      await screen.findByText(t('today.restDay', { when: t('today.tomorrow') })),
    ).toBeOnTheScreen();
    // Jeden wybrany dzień = jeden segment pierścienia.
    expect(screen.getByLabelText(t('today.ringPlanned', { done: 0, total: 1 }))).toBeOnTheScreen();
  });

  it('trening w toku: „Wznów”', async () => {
    const { dayId } = await activePlan();
    await startWorkoutFromDay(mockDb, dayId);
    await renderWithTheme(<StartScreen />);
    expect(await screen.findByText(t('today.active'))).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: t('today.resumeLabel', { name: 'Push A' }) }),
    );
    expect(mockRouter.push).toHaveBeenCalledWith('/trening');
  });

  it('po treningu: „Zrobione” i podsumowanie', async () => {
    const { dayId } = await activePlan();
    const workoutId = await startWorkoutFromDay(mockDb, dayId);
    const workout = await getWorkout(mockDb, workoutId);
    for (const set of workout!.exercises[0].sets) {
      await updateSet(mockDb, set.id, { ...set, completedAt: new Date().toISOString() });
    }
    await completeWorkout(mockDb, workoutId);
    await renderWithTheme(<StartScreen />);
    expect(await screen.findByRole('header', { name: t('today.done') })).toBeOnTheScreen();
    expect(screen.getByText(t('today.doneWeek', { done: 1, total: 1 }))).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: t('today.summary') }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/trening/podsumowanie',
      params: { id: workoutId },
    });
  });
});

describe('trening w toku', () => {
  it('krok ciężaru z Ustawień: „+” na klawiaturze dodaje 5 kg', async () => {
    await setSetting(mockDb, SETTING.weightStepKg, 5);
    const { dayId } = await activePlan();
    const workoutId = await startWorkoutFromDay(mockDb, dayId);
    await renderWithTheme(<WorkoutScreen />);

    await fireEvent.press(
      await screen.findByRole('button', {
        name: t('workout.editWeight', { n: '1', value: '60' }),
      }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: t('workout.keypad.plusLabelWeight', { step: '5' }) }),
    );
    await fireEvent.press(screen.getByRole('button', { name: t('workout.keypad.nextReps') }));
    await waitFor(async () => {
      const set = (await getWorkout(mockDb, workoutId))!.exercises[0].sets[0];
      expect(set.weightKg).toBe(65);
    });
  });

  it('wpisanie ciężaru klawiaturą, odhaczenie serii, przerwa i zakończenie', async () => {
    const { dayId } = await activePlan();
    const workoutId = await startWorkoutFromDay(mockDb, dayId);
    await renderWithTheme(<WorkoutScreen />);

    expect(await screen.findByRole('header', { name: 'Push A' })).toBeOnTheScreen();
    expect(screen.getByText(t('workout.primaryComplete', { n: '1' }))).toBeOnTheScreen();
    expect(screen.getByText('60 kg × 10')).toBeOnTheScreen();

    // Ciężar serii 1: 6, 2, przecinek, 5 → 62,5; „Dalej” przechodzi do powtórzeń.
    await fireEvent.press(
      screen.getByRole('button', { name: t('workout.editWeight', { n: '1', value: '60' }) }),
    );
    for (const key of ['6', '2', t('workout.keypad.decimal'), '5']) {
      await fireEvent.press(screen.getByRole('button', { name: key }));
    }
    await fireEvent.press(screen.getByRole('button', { name: t('workout.keypad.nextReps') }));
    await fireEvent.press(screen.getByRole('button', { name: '9' }));
    // Ostatnie pole: przycisk odhacza serię.
    await fireEvent.press(screen.getByRole('button', { name: t('workout.keypad.complete') }));

    await waitFor(async () => {
      const set = (await getWorkout(mockDb, workoutId))!.exercises[0].sets[0];
      expect(set).toMatchObject({ weightKg: 62.5, reps: 9 });
      expect(set.completedAt).not.toBeNull();
    });
    expect(await screen.findByRole('timer')).toBeOnTheScreen();
    const rest = await getSetting<{ totalSec: number } | null>(mockDb, REST_SETTING, null);
    expect(rest?.totalSec).toBe(90);
    // Przerwa to pasek zamiast przycisku; stuknięcie w czas powiększa minutnik, „Zmniejsz” go nie pomija.
    expect(screen.getByText(t('workout.rest.toSet', { n: 2 }))).toBeOnTheScreen();
    expect(screen.queryByText(t('workout.primaryComplete', { n: '2' }))).toBeNull();
    await fireEvent.press(screen.getByRole('timer'));
    expect(await screen.findByText(t('workout.rest.of', { time: '1:30' }))).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: t('workout.rest.collapse') }));
    expect(await screen.findByText(t('workout.rest.toSet', { n: 2 }))).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('workout.rest.skipLabel') }));
    await waitFor(() => expect(screen.queryByRole('timer')).toBeNull());

    // Druga seria pływającym przyciskiem, potem „Zakończ trening”.
    await fireEvent.press(screen.getByText(t('workout.primaryComplete', { n: '2' })));
    expect(await screen.findByText(t('workout.primaryFinish'))).toBeOnTheScreen();
    await fireEvent.press(screen.getByText(t('workout.primaryFinish')));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: '/trening/podsumowanie',
        params: { id: workoutId },
      }),
    );
    expect((await listWorkouts(mockDb)).map((w) => w.id)).toEqual([workoutId]);
    expect(await getSetting(mockDb, REST_SETTING, 'brak')).toBeNull();
  });

  it('odhaczenie i cofnięcie odhaczenia wiersza', async () => {
    const { dayId } = await activePlan();
    const workoutId = await startWorkoutFromDay(mockDb, dayId);
    await renderWithTheme(<WorkoutScreen />);

    const checks = await screen.findAllByRole('checkbox');
    await fireEvent.press(checks[1]);
    await waitFor(async () =>
      expect(
        (await getWorkout(mockDb, workoutId))!.exercises[0].sets[1].completedAt,
      ).not.toBeNull(),
    );
    await fireEvent.press((await screen.findAllByRole('checkbox'))[1]);
    await waitFor(async () =>
      expect((await getWorkout(mockDb, workoutId))!.exercises[0].sets[1].completedAt).toBeNull(),
    );
  });

  it('rekord: plakietka w wierszu i „Nowy rekord” w pasku przerwy', async () => {
    const { dayId } = await activePlan();
    await finishedWorkout(dayId, '2026-11-10T10:00:00Z');
    const workoutId = await startWorkoutFromDay(mockDb, dayId);
    const workout = await getWorkout(mockDb, workoutId);
    const first = workout!.exercises[0].sets[0];
    await updateSet(mockDb, first.id, { ...first, weightKg: 70 });
    await renderWithTheme(<WorkoutScreen />);

    await fireEvent.press((await screen.findAllByRole('checkbox'))[0]);
    expect(await screen.findByLabelText(t('workout.recordBadgeLabel'))).toBeOnTheScreen();
    expect(screen.getByText(t('workout.record.title'))).toBeOnTheScreen();
  });
});

describe('podsumowanie', () => {
  it('liczby treningu i notatka', async () => {
    const { dayId } = await activePlan();
    const workoutId = await startWorkoutFromDay(mockDb, dayId, {
      startedAt: '2026-11-15T10:00:00Z',
    });
    const workout = await getWorkout(mockDb, workoutId);
    for (const set of workout!.exercises[0].sets) {
      await updateSet(mockDb, set.id, { ...set, completedAt: '2026-11-15T10:10:00Z' });
    }
    await completeWorkout(mockDb, workoutId, '2026-11-15T10:45:30Z');
    mockParams = { id: workoutId };

    await renderWithTheme(<WorkoutSummaryScreen />);
    expect(
      await screen.findByRole('header', {
        name: t('workout.summary.titleDone', { name: 'Push A' }),
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        t('workout.summary.stat', { label: t('workout.summary.duration'), value: '45:30' }),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        t('workout.summary.stat', { label: t('workout.summary.volume'), value: '1200 kg' }),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(t('workout.summary.noRecords'))).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: t('workout.summary.addNote') }));
    await fireEvent.changeText(screen.getByLabelText(t('workout.summary.note')), 'Dobrze szło');
    await fireEvent.press(screen.getByRole('button', { name: t('workout.summary.done') }));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect((await getWorkout(mockDb, workoutId))!.note).toBe('Dobrze szło');
  });
  it('porównanie z poprzednim treningiem tego dnia planu', async () => {
    const { dayId } = await activePlan();
    await finishedWorkout(dayId, '2026-11-10T10:00:00Z');
    const workoutId = await finishedWorkout(dayId, '2026-11-12T10:00:00Z', 70);
    mockParams = { id: workoutId };

    await renderWithTheme(<WorkoutSummaryScreen />);
    // 2 serie × 10: 1200 kg poprzednio, 1400 kg dziś.
    expect(
      await screen.findByText(t('workout.summary.compareMore', { value: '200' })),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(t('workout.summary.compareBody', { today: '1400', previous: '1200' })),
    ).toBeOnTheScreen();
  });
});
