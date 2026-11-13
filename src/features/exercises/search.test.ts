import type { Exercise } from '@/data/models';
import { BUILTIN_EXERCISES } from '@/data/seed/exercises';

import {
  activeFilterCount,
  EMPTY_FILTERS,
  exerciseName,
  groupByLetter,
  normalizeForSearch,
  searchExercises,
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

  it('nazwy zaczynające się od zapytania są pierwsze', () => {
    const [first] = searchExercises(all, 'wyciskanie', EMPTY_FILTERS);
    expect(first.searchText.startsWith('wyciskanie')).toBe(true);
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
