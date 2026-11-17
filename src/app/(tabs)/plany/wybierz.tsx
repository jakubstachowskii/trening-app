import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useDb } from '@/data/DatabaseProvider';
import { loadTrainingSettings } from '@/features/settings/keys';
import { listExercises } from '@/data/repositories/exercises';
import { addPlanExercise } from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { defaultPlanExercise } from '@/features/exercises/defaults';
import { ExerciseList } from '@/features/exercises/ExerciseList';
import { EMPTY_FILTERS, searchExercises, withNames } from '@/features/exercises/search';
import { t } from '@/i18n';

/** Wybór ćwiczenia do dnia planu: ta sama lista co w karcie Ćwiczenia, bez ukrytych. */
export default function ExercisePicker() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const db = useDb();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const { data, loading } = useDbQuery((database) => listExercises(database), 'picker');
  const named = useMemo(() => withNames(data ?? []), [data]);
  const results = useMemo(() => searchExercises(named, query, EMPTY_FILTERS), [named, query]);

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('exerciseList.searchPlaceholder'),
            hideWhenScrolling: false,
            autoCapitalize: 'none',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
          },
          headerLeft: () => (
            <Button variant="text" label={t('common.cancel')} onPress={() => router.back()} />
          ),
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
          if (adding) return;
          setAdding(true);
          try {
            await addPlanExercise(
              db,
              dayId,
              defaultPlanExercise(
                exercise.id,
                exercise.type,
                (await loadTrainingSettings(db)).restDefaultSec,
              ),
            );
            router.back();
          } finally {
            setAdding(false);
          }
        }}
      />
    </>
  );
}
