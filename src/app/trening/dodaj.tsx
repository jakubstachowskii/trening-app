import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useDb } from '@/data/DatabaseProvider';
import { loadTrainingSettings } from '@/features/settings/keys';
import { listExercises } from '@/data/repositories/exercises';
import {
  addExerciseToWorkout,
  getUnfinishedWorkout,
  replaceWorkoutExercise,
} from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import { ExerciseList } from '@/features/exercises/ExerciseList';
import { EMPTY_FILTERS, searchExercises, withNames } from '@/features/exercises/search';
import { t } from '@/i18n';

/** Wybór ćwiczenia w trakcie treningu: dodanie na koniec albo zamiana (`replace` = id w treningu). */
export default function WorkoutExercisePicker() {
  const { replace } = useLocalSearchParams<{ replace?: string }>();
  const router = useRouter();
  const db = useDb();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, loading } = useDbQuery((database) => listExercises(database), 'workout-picker');
  const named = useMemo(() => withNames(data ?? []), [data]);
  const results = useMemo(() => searchExercises(named, query, EMPTY_FILTERS), [named, query]);

  return (
    <>
      <Stack.Screen
        options={{
          title: replace ? t('workout.replaceExercise') : t('workout.addExercise'),
          headerSearchBarOptions: {
            placeholder: t('exerciseList.searchPlaceholder'),
            hideWhenScrolling: false,
            autoCapitalize: 'none',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
          },
        }}
      />
      <ExerciseList
        exercises={loading ? [] : results}
        grouped={!query.trim()}
        empty={
          loading ? (
            <Skeleton rows={6} />
          ) : (
            <EmptyState
              title={t('exerciseList.noResultsTitle')}
              body={t('exerciseList.noResultsBody')}
            />
          )
        }
        onSelect={async (exercise) => {
          if (busy) return;
          setBusy(true);
          try {
            if (replace) {
              await replaceWorkoutExercise(db, replace, exercise.id, {
                stepKg: (await loadTrainingSettings(db)).weightStepKg,
              });
            } else {
              const workout = await getUnfinishedWorkout(db);
              if (workout)
                await addExerciseToWorkout(db, workout.id, exercise.id, {
                  stepKg: (await loadTrainingSettings(db)).weightStepKg,
                });
            }
            router.back();
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
