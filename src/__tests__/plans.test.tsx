import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import PlanScreen from '@/app/(tabs)/plany/[id]';
import PlanExerciseSheet from '@/app/(tabs)/plany/cwiczenie/[id]';
import PlanDayScreen from '@/app/(tabs)/plany/dzien/[dayId]';
import PlansScreen from '@/app/(tabs)/plany/index';
import ProgramScreen from '@/app/(tabs)/plany/program/[programId]';
import type { Db } from '@/data/db';
import { copyProgram, getPlan, listPlans, setActivePlan } from '@/data/repositories/plans';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import { t, tMaybe } from '@/i18n';

import { renderWithTheme, seededDb } from './helpers/screen';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
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

const ppl = BUILTIN_PROGRAMS.find((p) => p.id === 'push-pull-legs')!;
const translate = (key: string) => tMaybe(key) ?? key;

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockDb = await seededDb();
});

describe('lista planów', () => {
  it('bez aktywnego planu: programy z polecanym na górze i „Ułóż własny plan”', async () => {
    await renderWithTheme(<PlansScreen />);
    expect(await screen.findByText(t('planTab.emptyBody'))).toBeOnTheScreen();
    const programs = screen.getAllByRole('button', { name: /treningach w tygodniu|Przy |Gdy / });
    // Cel domyślny 3 → polecane „Całe ciało” jako pierwsze, z plakietką.
    expect(programs[0]).toHaveProp(
      'accessibilityLabel',
      expect.stringMatching(/^Całe ciało, Polecany przy 3 treningach w tygodniu/),
    );

    await fireEvent.press(screen.getByRole('button', { name: t('planTab.ownPlan') }));
    expect(mockRouter.push).toHaveBeenCalledWith('/plany/nowy');
  });

  it('aktywny plan: tydzień w kolejności planu z „Zacznij” przy pierwszym, pozostałe plany niżej', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    await setActivePlan(mockDb, planId);
    const other = await copyProgram(mockDb, BUILTIN_PROGRAMS[0], translate);
    await renderWithTheme(<PlansScreen />);

    expect(await screen.findByRole('header', { name: 'Push / Pull / Nogi' })).toBeOnTheScreen();
    expect(screen.getByText(/^3 treningi w tygodniu · 0 z 3 zrobione$/)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: t('planTab.startLabel', { name: 'Push' }) }),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Pull, 6 ćwiczeń$/)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: t('planTab.others') })).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: /^Całe ciało, 3 treningi · gotowy program/ }),
    );
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/plany/[id]',
      params: { id: other },
    });
  });
});

describe('gotowy program', () => {
  it('„Wybieram ten plan”: program staje się aktywnym planem, drugi wybór nie robi kopii', async () => {
    mockParams = { programId: 'push-pull-legs' };
    await renderWithTheme(<ProgramScreen />);
    await fireEvent.press(screen.getByRole('button', { name: t('program.copy') }));

    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/plany'));
    const [plan] = await listPlans(mockDb);
    expect(plan).toMatchObject({
      name: 'Push / Pull / Nogi',
      sourceProgramId: 'push-pull-legs',
      isActive: true,
    });

    await fireEvent.press(screen.getByRole('button', { name: t('program.copy') }));
    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledTimes(2));
    expect(await listPlans(mockDb)).toHaveLength(1);
  });
});

describe('plan i dzień', () => {
  it('plan: dni z liczbą ćwiczeń i ustawienie jako aktywny', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    mockParams = { id: planId };
    await renderWithTheme(<PlanScreen />);

    expect(await screen.findByRole('button', { name: 'Push, 6 ćwiczeń' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: t('planDetail.setActive') }));
    expect(await screen.findByText(t('planDetail.isActive'))).toBeOnTheScreen();
    expect((await getPlan(mockDb, planId))?.isActive).toBe(true);
  });

  it('plan: wybór dni treningowych zapisuje się w planie', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    mockParams = { id: planId };
    await renderWithTheme(<PlanScreen />);

    await fireEvent.press(await screen.findByRole('checkbox', { name: 'poniedziałek' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'środa' }));
    await waitFor(async () => expect((await getPlan(mockDb, planId))?.weekdays).toEqual([0, 2]));
    expect(screen.getByRole('checkbox', { name: 'środa' })).toBeChecked();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'poniedziałek' }));
    await waitFor(async () => expect((await getPlan(mockDb, planId))?.weekdays).toEqual([2]));
  });

  it('plan: akcja VoiceOver „Przesuń niżej” zmienia kolejność dni', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    mockParams = { id: planId };
    await renderWithTheme(<PlanScreen />);
    const push = await screen.findByRole('button', { name: 'Push, 6 ćwiczeń' });

    await fireEvent(push, 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } });
    await waitFor(async () =>
      expect((await getPlan(mockDb, planId))?.days.map((d) => d.name)).toEqual([
        'Pull',
        'Push',
        'Nogi',
      ]),
    );
  });

  it('dzień: ćwiczenia z celem serii i przerwą', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    const plan = await getPlan(mockDb, planId);
    mockParams = { dayId: plan!.days[0].id };
    await renderWithTheme(<PlanDayScreen />);

    expect(
      await screen.findByRole('button', {
        name: 'Wyciskanie sztangi na ławce poziomej, 4 × 6–10 · przerwa 2 min 30 s',
      }),
    ).toBeOnTheScreen();
  });

  it('serie: „od” większe niż „do” blokuje zapis i pokazuje błąd', async () => {
    const planId = await copyProgram(mockDb, ppl, translate);
    const plan = await getPlan(mockDb, planId);
    mockParams = { id: plan!.days[0].exercises[0].id };
    await renderWithTheme(<PlanExerciseSheet />);

    const repsMin = await screen.findByRole('adjustable', { name: t('planExercise.repsMin') });
    for (let i = 0; i < 6; i++) {
      await fireEvent(repsMin, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    }
    expect(await screen.findByText(t('planExercise.repsOrder'))).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: t('common.save') })[0]).toBeDisabled();
  });
});
