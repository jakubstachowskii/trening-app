import type { Exercise } from '@/data/models';
import { BUILTIN_EXERCISES } from '@/data/seed/exercises';
import pl from '@/i18n/locales/pl.json';

import { POPULAR_EXERCISE_IDS } from './popular';
import {
  activeFilterCount,
  EMPTY_FILTERS,
  exerciseName,
  groupByLetter,
  matchTier,
  normalizeForSearch,
  searchExercises,
  searchStem,
  toggle,
  withNames,
} from './search';

const builtin: Exercise[] = BUILTIN_EXERCISES.map((e) => ({
  ...e,
  source: 'builtin',
  name: null,
  note: null,
  isHidden: false,
}));

const custom: Exercise = {
  id: 'u1',
  source: 'user',
  name: 'Łódka na brzuchu',
  type: 'time',
  primaryMuscles: ['lower_back'],
  secondaryMuscles: ['glutes'],
  equipment: 'bodyweight',
  note: null,
  isHidden: false,
};

const all = withNames([
  ...builtin,
  custom,
  { ...custom, id: 'u2', name: 'Ukryte', isHidden: true },
]);

describe('wyszukiwanie ćwiczeń', () => {
  it('normalizuje polskie znaki, wielkość liter i spacje', () => {
    expect(normalizeForSearch('  Wyciskanie   na ŁAWCE skośnej ')).toBe(
      'wyciskanie na lawce skosnej',
    );
  });

  it('każde gotowe ćwiczenie ma nazwę z tłumaczeń', () => {
    for (const exercise of builtin) {
      expect(exerciseName(exercise)).not.toBe(exercise.id);
    }
  });

  it('znajduje bez polskich znaków i w dowolnej kolejności słów', () => {
    const names = searchExercises(all, 'lawce wyciskanie', EMPTY_FILTERS).map((e) => e.id);
    expect(names).toContain('bench-press');
    expect(searchExercises(all, 'lodka', EMPTY_FILTERS).map((e) => e.id)).toContain('u1');
  });

  it('znajduje inne odmiany słów („lawka” → „ławce”, „hantle” → „hantli”)', () => {
    expect(searchExercises(all, 'lawka', EMPTY_FILTERS).map((e) => e.id)).toContain('bench-press');
    expect(searchExercises(all, 'wyciskanie hantle', EMPTY_FILTERS).map((e) => e.id)).toContain(
      'dumbbell-bench-press',
    );
    expect(searchExercises(all, 'przysiad sztanga', EMPTY_FILTERS).map((e) => e.id)).toContain(
      'back-squat',
    );
  });

  it('rdzeń: krótkie słowa bez zmian, średnie bez 2 liter, długie bez 3', () => {
    expect(searchStem('law')).toBe('law');
    expect(searchStem('lawka')).toBe('law');
    expect(searchStem('hantle')).toBe('hant');
    expect(searchStem('plaskiej')).toBe('plask');
    expect(searchStem('wyciskanie')).toBe('wyciska');
  });

  it('nazwy zaczynające się od zapytania są pierwsze', () => {
    const [first] = searchExercises(all, 'wyciskanie', EMPTY_FILTERS);
    expect(first.searchText.startsWith('wyciskanie')).toBe(true);
  });

  it('wśród równie dobrych trafień popularne ćwiczenia idą pierwsze', () => {
    const ids = searchExercises(all, 'wyciskanie', EMPTY_FILTERS).map((e) => e.id);
    expect(ids[0]).toBe('bench-press');
    expect(ids.indexOf('bench-press')).toBeLessThan(ids.indexOf('arnold-press'));
  });

  it('znajduje po potocznych nazwach, których nie ma w nazwie ćwiczenia', () => {
    const ids = (query: string) => searchExercises(all, query, EMPTY_FILTERS).map((e) => e.id);
    expect(ids('plask')[0]).toBe('bench-press');
    expect(ids('wyciskanie na lawce plaskiej')).toContain('bench-press');
    expect(ids('bench')).toContain('bench-press');
    expect(ids('klata')).toContain('bench-press');
    expect(ids('squat')[0]).toBe('back-squat');
    expect(ids('rdl')).toEqual(['romanian-deadlift']);
  });

  it('znajduje po głównym mięśniu i sprzęcie', () => {
    const ids = searchExercises(all, 'biceps', EMPTY_FILTERS).map((e) => e.id);
    expect(ids).toContain('hammer-curl');
    expect(ids).not.toContain('pull-up');
    expect(searchExercises(all, 'kettlebell', EMPTY_FILTERS).map((e) => e.id)).toContain(
      'kettlebell-swing',
    );
  });

  it('dosłowne trafienie w słowach kluczowych wyprzedza inną odmianę w nazwie', () => {
    const ids = searchExercises(all, 'plecy', EMPTY_FILTERS).map((e) => e.id);
    expect(ids.indexOf('barbell-row')).toBeLessThan(ids.indexOf('back-squat'));
    expect(
      matchTier(
        all.find((e) => e.id === 'back-squat')!,
        'plecy',
      ),
    ).toBe(3);
  });

  it('słowa kluczowe i lista popularnych odnoszą się do istniejących ćwiczeń', () => {
    const builtinIds = new Set(builtin.map((e) => e.id));
    for (const id of [...Object.keys(pl.exerciseKeywords), ...POPULAR_EXERCISE_IDS]) {
      expect(builtinIds.has(id)).toBe(true);
    }
    expect(new Set(POPULAR_EXERCISE_IDS).size).toBe(POPULAR_EXERCISE_IDS.length);
  });

  it('ukryte tylko z filtrem „pokaż ukryte”', () => {
    expect(searchExercises(all, 'ukryte', EMPTY_FILTERS)).toHaveLength(0);
    expect(searchExercises(all, 'ukryte', { ...EMPTY_FILTERS, showHidden: true })).toHaveLength(1);
  });

  it('filtr mięśni obejmuje też mięśnie dodatkowe', () => {
    const found = searchExercises(all, '', { ...EMPTY_FILTERS, muscles: ['triceps'] });
    expect(found.map((e) => e.id)).toEqual(expect.arrayContaining(['bench-press']));
    expect(
      found.every((e) => [...e.primaryMuscles, ...e.secondaryMuscles].includes('triceps')),
    ).toBe(true);
  });

  it('filtry sprzętu, typu i „tylko własne” łączą się warunkiem „i”', () => {
    const found = searchExercises(all, '', {
      ...EMPTY_FILTERS,
      equipment: ['bodyweight'],
      types: ['time'],
      onlyCustom: true,
    });
    expect(found.map((e) => e.id)).toEqual(['u1']);
  });

  it('bez zapytania sortuje alfabetycznie po polsku i grupuje po literze', () => {
    const sorted = searchExercises(all, '', EMPTY_FILTERS);
    const sections = groupByLetter(sorted);
    const letters = sections.map((s) => s.title);
    expect(new Set(letters).size).toBe(letters.length);
    expect(letters.indexOf('L')).toBeLessThan(letters.indexOf('Ł'));
    expect(sections.reduce((sum, s) => sum + s.data.length, 0)).toBe(sorted.length);
  });

  it('liczy aktywne filtry i przełącza wartości', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, muscles: ['chest', 'lats'], showHidden: true }),
    ).toBe(3);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
  });
});
