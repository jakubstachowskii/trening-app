// Wyszukiwanie i filtrowanie bazy ćwiczeń. Czyste funkcje, bez bazy i bez Reacta.
import type { Equipment, Exercise, Muscle } from '@/data/models';
import type { ExerciseType } from '@/domain/types';
import { tMaybe } from '@/i18n';

export type ExerciseFilters = {
  muscles: Muscle[];
  equipment: Equipment[];
  types: ExerciseType[];
  /** Tylko własne ćwiczenia użytkownika. */
  onlyCustom: boolean;
  showHidden: boolean;
};

export const EMPTY_FILTERS: ExerciseFilters = {
  muscles: [],
  equipment: [],
  types: [],
  onlyCustom: false,
  showHidden: false,
};

/** Liczba aktywnych filtrów (na przycisku „Filtry”). */
export function activeFilterCount(filters: ExerciseFilters): number {
  return (
    filters.muscles.length +
    filters.equipment.length +
    filters.types.length +
    (filters.onlyCustom ? 1 : 0) +
    (filters.showHidden ? 1 : 0)
  );
}

/** Nazwa do wyświetlenia: gotowe z tłumaczeń, własne z bazy. */
export function exerciseName(exercise: Pick<Exercise, 'id' | 'source' | 'name'>): string {
  if (exercise.source === 'user') return exercise.name ?? '';
  return tMaybe(`exercises.${exercise.id}`) ?? exercise.id;
}

/** Małe litery bez polskich znaków i nadmiarowych spacji: „Ławka  skośna” → „lawka skosna”. */
export function normalizeForSearch(text: string): string {
  return text
    .toLocaleLowerCase('pl')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type NamedExercise = Exercise & { displayName: string; searchText: string };

/** Dokłada nazwę i tekst do wyszukiwania raz, zamiast przy każdym wpisanym znaku. */
export function withNames(exercises: Exercise[]): NamedExercise[] {
  return exercises.map((exercise) => {
    const displayName = exerciseName(exercise);
    return { ...exercise, displayName, searchText: normalizeForSearch(displayName) };
  });
}

/** Każde słowo zapytania musi wystąpić w nazwie (kolejność dowolna, początek słowa nie wymagany). */
export function matchesQuery(exercise: NamedExercise, query: string): boolean {
  const words = normalizeForSearch(query).split(' ').filter(Boolean);
  return words.every((word) => exercise.searchText.includes(word));
}

export function matchesFilters(exercise: Exercise, filters: ExerciseFilters): boolean {
  if (exercise.isHidden && !filters.showHidden) return false;
  if (filters.onlyCustom && exercise.source !== 'user') return false;
  if (filters.types.length && !filters.types.includes(exercise.type)) return false;
  if (filters.equipment.length && !filters.equipment.includes(exercise.equipment)) return false;
  if (filters.muscles.length) {
    const worked = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
    if (!filters.muscles.some((muscle) => worked.includes(muscle))) return false;
  }
  return true;
}

const collator = new Intl.Collator('pl', { sensitivity: 'base' });

/**
 * Wynik dla listy: przefiltrowane i posortowane po nazwie.
 * Przy wpisanym zapytaniu najpierw te, których nazwa zaczyna się od zapytania.
 */
export function searchExercises(
  exercises: NamedExercise[],
  query: string,
  filters: ExerciseFilters,
): NamedExercise[] {
  const normalized = normalizeForSearch(query);
  const found = exercises.filter(
    (exercise) => matchesFilters(exercise, filters) && matchesQuery(exercise, query),
  );
  return found.sort((a, b) => {
    if (normalized) {
      const aStarts = a.searchText.startsWith(normalized);
      const bStarts = b.searchText.startsWith(normalized);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
    }
    return collator.compare(a.displayName, b.displayName);
  });
}

export type ExerciseSection = { title: string; data: NamedExercise[] };

/** Sekcje alfabetyczne po pierwszej literze nazwy (polski alfabet: „Ł” osobno od „L”). */
export function groupByLetter(exercises: NamedExercise[]): ExerciseSection[] {
  const sections: ExerciseSection[] = [];
  for (const exercise of exercises) {
    const letter = exercise.displayName.charAt(0).toLocaleUpperCase('pl') || '#';
    const last = sections.at(-1);
    if (last && last.title === letter) last.data.push(exercise);
    else sections.push({ title: letter, data: [exercise] });
  }
  return sections;
}

/** Przełącza wartość w tablicy filtra (dodaje albo usuwa). */
export function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
