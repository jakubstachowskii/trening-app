// Pierwsze uruchomienie (jedno pytanie → propozycja planu), warunek pokazania na „Dziś” i Ustawienia.
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import TodayScreen from '@/app/(tabs)/index';
import OnboardingQuestion from '@/app/start/index';
import OnboardingProposal from '@/app/start/plan';
import SettingsScreen from '@/app/ustawienia';
import type { Db } from '@/data/db';
import { createPlan, listPlans, setActivePlan } from '@/data/repositories/plans';
import { getSetting } from '@/data/repositories/settings';
import { isOnboardingDone, SETTING } from '@/features/settings/keys';
import { t } from '@/i18n';

import { renderWithTheme, seededDb } from './helpers/screen';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  dismissAll: jest.fn(),
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

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockDb = await seededDb();
});

describe('warunek wprowadzenia na „Dziś”', () => {
  it('bez planu i bez wprowadzenia: przejście do pytania', async () => {
    await renderWithTheme(<TodayScreen />);
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/start'));
  });

  it('z aktywnym planem: bez wprowadzenia, za to zapamiętane jako przejdzione', async () => {
    const planId = await createPlan(mockDb, { name: 'Mój plan' });
    await setActivePlan(mockDb, planId);
    await renderWithTheme(<TodayScreen />);
    await waitFor(async () => expect(await isOnboardingDone(mockDb)).toBe(true));
    expect(mockRouter.push).not.toHaveBeenCalledWith('/start');
  });
});

describe('pytanie', () => {
  it('wybór liczby i „Pokaż mój plan” przekazuje cel', async () => {
    await renderWithTheme(<OnboardingQuestion />);
    await fireEvent.press(
      screen.getByRole('radio', { name: t('onboarding.goalOption', { count: 5 }) }),
    );
    expect(
      screen.getByRole('radio', { name: t('onboarding.goalOption', { count: 5 }) }),
    ).toBeChecked();
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.showPlan') }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/start/plan',
      params: { goal: '5' },
    });
  });

  it('„Pomiń”: bez planu, cel 3, wprowadzenie zamknięte', async () => {
    await renderWithTheme(<OnboardingQuestion />);
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.skip') }));
    await waitFor(() => expect(mockRouter.dismissAll).toHaveBeenCalled());
    expect(await listPlans(mockDb)).toHaveLength(0);
    expect(await getSetting(mockDb, SETTING.weeklyGoal, null)).toBe(3);
    expect(await isOnboardingDone(mockDb)).toBe(true);
  });

  it('ponownie z „Pomóż mi wybrać”: „Anuluj” zamiast „Pomiń”, nic nie zapisuje', async () => {
    mockParams = { again: '1' };
    await renderWithTheme(<OnboardingQuestion />);
    expect(screen.queryByRole('button', { name: t('onboarding.skip') })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.cancel') }));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(await isOnboardingDone(mockDb)).toBe(false);
  });
});

describe('propozycja planu', () => {
  it('4 razy w tygodniu → Góra / dół; „Zaczynam z tym planem” ustawia go jako aktywny', async () => {
    mockParams = { goal: '4' };
    await renderWithTheme(<OnboardingProposal />);
    expect(screen.getByRole('header', { name: 'Góra / dół' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.choose') }));

    await waitFor(() => expect(mockRouter.dismissAll).toHaveBeenCalled());
    const plans = await listPlans(mockDb);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ sourceProgramId: 'upper-lower-4', isActive: true });
    expect(await getSetting(mockDb, SETTING.weeklyGoal, null)).toBe(4);
    expect(await isOnboardingDone(mockDb)).toBe(true);
  });

  it('„Na razie bez planu”: cel zapisany, bez planu', async () => {
    mockParams = { goal: '2' };
    await renderWithTheme(<OnboardingProposal />);
    expect(screen.getByRole('header', { name: 'Całe ciało' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.noPlan') }));
    await waitFor(() => expect(mockRouter.dismissAll).toHaveBeenCalled());
    expect(await listPlans(mockDb)).toHaveLength(0);
    expect(await getSetting(mockDb, SETTING.weeklyGoal, null)).toBe(2);
  });

  it('„Inne plany albo własny” prowadzi do listy programów', async () => {
    mockParams = { goal: '6' };
    await renderWithTheme(<OnboardingProposal />);
    await fireEvent.press(screen.getByRole('button', { name: t('onboarding.other') }));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenCalledWith('/plany/programy'));
  });
});

describe('Ustawienia', () => {
  it('pokazują wartości domyślne, a przełącznik wygaszania zapisuje się', async () => {
    await renderWithTheme(<SettingsScreen />);
    // Wiersze są natywnym menu iOS (Expo UI) — w testach sprawdzamy widoczne wartości.
    expect(await screen.findByText(t('settings.weeklyGoal'))).toBeOnTheScreen();
    expect(screen.getByText('3 treningi')).toBeOnTheScreen();
    expect(screen.getByText('2:00')).toBeOnTheScreen();
    expect(screen.getByText('2,5 kg')).toBeOnTheScreen();

    await fireEvent(screen.getByLabelText(t('settings.keepAwakeLabel')), 'valueChange', false);
    await waitFor(async () =>
      expect(await getSetting(mockDb, SETTING.keepAwake, true)).toBe(false),
    );
  });
});
