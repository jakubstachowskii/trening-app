import { Stack } from 'expo-router';

import { SHEET_OPTIONS, useStackScreenOptions } from '@/components/stack';
import { ExerciseFiltersProvider } from '@/features/exercises/FiltersContext';
import { t } from '@/i18n';

export default function ExercisesLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <ExerciseFiltersProvider>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen
          name="index"
          options={{ title: t('screens.exercises.title'), headerLargeTitleEnabled: true }}
        />
        <Stack.Screen name="[id]" options={{ title: '' }} />
        <Stack.Screen name="filtry" options={{ ...SHEET_OPTIONS, title: t('filters.title') }} />
        <Stack.Screen
          name="nowe"
          options={{ ...SHEET_OPTIONS, title: t('customExercise.titleNew') }}
        />
        <Stack.Screen name="dodaj" options={{ ...SHEET_OPTIONS, title: t('addToPlan.title') }} />
      </Stack>
    </ExerciseFiltersProvider>
  );
}
