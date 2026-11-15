// Wyszukiwanie i filtrowanie bazy ćwiczeń. Czyste funkcje, bez bazy i bez Reacta.
import type { Equipment, Exercise, Muscle } from '@/data/models';
import type { ExerciseType } from '@/domain/types';
import { tMaybe } from '@/i18n';

import { popularityRank } from './popular';

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

export type NamedExercise = Exercise & {
  displayName: string;
  /** Nazwa do wyszukiwania. */
  searchText: string;
  /** Dodatkowe słowa: potoczne nazwy („płaska ławka”, „bench”), główne mięśnie i sprzęt. */
  extraText: string;
};

/** Słowa, po których też można znaleźć ćwiczenie, choć nie ma ich w nazwie. */
function extraSearchWords(exercise: Exercise): string {
  return [
    exercise.source === 'builtin' ? tMaybe(`exerciseKeywords.${exercise.id}`) : undefined,
    ...exercise.primaryMuscles.map((muscle) => tMaybe(`muscles.${muscle}`)),
    tMaybe(`equipment.${exercise.equipment}`),
  ]
    .filter(Boolean)
    .join(' ');
}

/** Dokłada nazwę i tekst do wyszukiwania raz, zamiast przy każdym wpisanym znaku. */
export function withNames(exercises: Exercise[]): NamedExercise[] {
  return exercises.map((exercise) => {
    const displayName = exerciseName(exercise);
    return {
      ...exercise,
      displayName,
      searchText: normalizeForSearch(displayName),
      extraText: normalizeForSearch(extraSearchWords(exercise)),
    };
  });
}

/**
 * Rdzeń słowa do porównania odmian: polskie końcówki zmieniają ostatnie 1–3 litery
 * („ławka”, „ławce” → „law”; „hantle”, „hantli” → „hant”; „płaskiej”, „płaska” → „plask”).
 * Krótkie słowa bez zmian, dłuższe (7+) tracą 3 litery, bo mają dłuższe końcówki („-iej”, „-ami”).
 */
export function searchStem(word: string): string {
  if (word.length <= 4) return word;
  const cut = word.length >= 7 ? 3 : 2;
  return word.slice(0, Math.max(3, word.length - cut));
}

/** Słowo zapytania pasuje do tekstu jako fragment albo rdzeniem jako początek słowa (inna odmiana). */
function wordMatches(word: string, text: string): boolean {
  const stem = searchStem(word);
  return text.includes(word) || text.split(' ').some((textWord) => textWord.startsWith(stem));
}

function queryWords(query: string): string[] {
  return normalizeForSearch(query).split(' ').filter(Boolean);
}

/**
 * Każde słowo zapytania musi pasować (kolejność słów dowolna) do nazwy
 * albo do dodatkowych słów ćwiczenia (potoczne nazwy, mięśnie, sprzęt).
 */
export function matchesQuery(exercise: NamedExercise, query: string): boolean {
  return queryWords(query).every(
    (word) => wordMatches(word, exercise.searchText) || wordMatches(word, exercise.extraText),
  );
}

/**
 * Jak dobre jest trafienie (mniej = lepiej):
 * 0 — nazwa zaczyna się od zapytania; 1 — każde słowo dosłownie w nazwie;
 * 2 — każde słowo dosłownie w nazwie albo w dodatkowych słowach; 3 — tylko przez inną odmianę.
 * Dzięki temu „plecy” daje najpierw wiosłowania (słowo kluczowe), a nie przysiad „na plecach”.
 */
export function matchTier(exercise: NamedExercise, query: string): number {
  const normalized = normalizeForSearch(query);
  if (exercise.searchText.startsWith(normalized)) return 0;
  const words = queryWords(query);
  if (words.every((word) => exercise.searchText.includes(word))) return 1;
  if (
    words.every((word) => exercise.searchText.includes(word) || exercise.extraText.includes(word))
  ) {
    return 2;
  }
  return 3;
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
 * Wynik dla listy. Bez zapytania: alfabetycznie (lista dzieli się na litery).
 * Z zapytaniem: najpierw najlepsze trafienia (matchTier), w nich popularne ćwiczenia, potem alfabetycznie.
 */
export function searchExercises(
  exercises: NamedExercise[],
  query: string,
  filters: ExerciseFilters,
): NamedExercise[] {
  const hasQuery = normalizeForSearch(query) !== '';
  const found = exercises
    .filter((exercise) => matchesFilters(exercise, filters) && matchesQuery(exercise, query))
    .map((exercise) => ({
      exercise,
      tier: hasQuery ? matchTier(exercise, query) : 0,
      popularity: hasQuery ? popularityRank(exercise.id) : 0,
    }));
  found.sort(
    (a, b) =>
      a.tier - b.tier ||
      a.popularity - b.popularity ||
      collator.compare(a.exercise.displayName, b.exercise.displayName),
  );
  return found.map(({ exercise }) => exercise);
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
