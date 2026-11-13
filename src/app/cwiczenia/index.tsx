import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { HeaderIconButton } from '@/components/stack';
import { listExercises } from '@/data/repositories/exercises';
import { useDbQuery } from '@/data/useDbQuery';
import { ExerciseList } from '@/features/exercises/ExerciseList';
import { useExerciseFilters } from '@/features/exercises/FiltersContext';
import {
  activeFilterCount,
  EMPTY_FILTERS,
  type ExerciseFilters,
  searchExercises,
  withNames,
} from '@/features/exercises/search';
import { t, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

type ActivePill = { key: string; label: string; remove: (f: ExerciseFilters) => ExerciseFilters };

function activePills(filters: ExerciseFilters): ActivePill[] {
  return [
    ...filters.muscles.map((m) => ({
      key: `m-${m}`,
      label: tMaybe(`muscles.${m}`) ?? m,
      remove: (f: ExerciseFilters) => ({ ...f, muscles: f.muscles.filter((x) => x !== m) }),
    })),
    ...filters.equipment.map((e) => ({
      key: `e-${e}`,
      label: tMaybe(`equipment.${e}`) ?? e,
      remove: (f: ExerciseFilters) => ({ ...f, equipment: f.equipment.filter((x) => x !== e) }),
    })),
    ...filters.types.map((ty) => ({
      key: `t-${ty}`,
      label: tMaybe(`exerciseTypes.${ty}`) ?? ty,
      remove: (f: ExerciseFilters) => ({ ...f, types: f.types.filter((x) => x !== ty) }),
    })),
    ...(filters.onlyCustom
      ? [
          {
            key: 'custom',
            label: t('filters.onlyCustom'),
            remove: (f: ExerciseFilters) => ({ ...f, onlyCustom: false }),
          },
        ]
      : []),
    ...(filters.showHidden
      ? [
          {
            key: 'hidden',
            label: t('filters.showHidden'),
            remove: (f: ExerciseFilters) => ({ ...f, showHidden: false }),
          },
        ]
      : []),
  ];
}

export default function ExercisesScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { filters, setFilters } = useExerciseFilters();
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useDbQuery(
    (db) => listExercises(db, { includeHidden: true }),
    'exercises',
  );

  const named = useMemo(() => withNames(data ?? []), [data]);
  const results = useMemo(() => searchExercises(named, query, filters), [named, query, filters]);
  const count = activeFilterCount(filters);
  const pills = activePills(filters);

  const header = (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Button
          variant="secondary"
          icon={{ ios: 'line.3.horizontal.decrease', web: 'filter_list' }}
          label={count ? t('exerciseList.filtersCount', { count }) : t('exerciseList.filters')}
          onPress={() => router.push('/cwiczenia/filtry')}
        />
      </View>
      {pills.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.xs }}
        >
          {pills.map((pill) => (
            <Pill
              key={pill.key}
              label={pill.label}
              selected
              removable
              accessibilityLabel={t('exerciseList.removeFilter', { name: pill.label })}
              onPress={() => setFilters(pill.remove(filters))}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const empty = loading ? (
    <Skeleton rows={6} />
  ) : error ? (
    <EmptyState
      title={t('common.errorTitle')}
      body={t('common.errorBody')}
      action={{ label: t('common.retry'), onPress: () => void reload() }}
    />
  ) : (
    <EmptyState
      title={t('exerciseList.noResultsTitle')}
      body={t('exerciseList.noResultsBody')}
      action={
        count
          ? { label: t('exerciseList.clearFilters'), onPress: () => setFilters(EMPTY_FILTERS) }
          : undefined
      }
      secondaryAction={{
        label: t('exerciseList.add'),
        onPress: () => router.push('/cwiczenia/nowe'),
      }}
    />
  );

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
          headerRight: () => (
            <HeaderIconButton
              icon={{ ios: 'plus', web: 'add' }}
              label={t('exerciseList.add')}
              onPress={() => router.push('/cwiczenia/nowe')}
            />
          ),
        }}
      />
      <ExerciseList
        exercises={loading || error ? [] : results}
        grouped={!query.trim()}
        header={header}
        empty={empty}
        onSelect={(exercise) =>
          router.push({ pathname: '/cwiczenia/[id]', params: { id: exercise.id } })
        }
      />
    </>
  );
}
