// Filtry listy ćwiczeń współdzielone przez listę i arkusz „Filtry” (osobne trasy w jednym stosie).
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

import { EMPTY_FILTERS, type ExerciseFilters } from './search';

type Value = { filters: ExerciseFilters; setFilters: (next: ExerciseFilters) => void };

const FiltersContext = createContext<Value | null>(null);

export function ExerciseFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const value = useMemo(() => ({ filters, setFilters }), [filters]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useExerciseFilters(): Value {
  const value = useContext(FiltersContext);
  if (!value) throw new Error('useExerciseFilters() wymaga <ExerciseFiltersProvider>.');
  return value;
}
