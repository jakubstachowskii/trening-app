import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Section } from '@/components/Section';
import { EQUIPMENT, MUSCLES } from '@/data/models';
import { listExercises } from '@/data/repositories/exercises';
import { useDbQuery } from '@/data/useDbQuery';
import type { ExerciseType } from '@/domain/types';
import { useExerciseFilters } from '@/features/exercises/FiltersContext';
import { EMPTY_FILTERS, searchExercises, toggle, withNames } from '@/features/exercises/search';
import { t, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

const TYPES: ExerciseType[] = [
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
  'time',
];

function Chips({ children }: { children: React.ReactNode }) {
  const { space } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>{children}</View>;
}

export default function FiltersSheet() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const bottom = useFloatingButtonSpace();
  const { filters, setFilters } = useExerciseFilters();
  const { data } = useDbQuery((db) => listExercises(db, { includeHidden: true }), 'exercises');
  const named = useMemo(() => withNames(data ?? []), [data]);
  const count = searchExercises(named, '', filters).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="text"
              label={t('filters.reset')}
              onPress={() => setFilters(EMPTY_FILTERS)}
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: space.screen,
          paddingBottom: bottom,
          gap: space.section,
        }}
      >
        <Section title={t('filters.muscles')}>
          <Chips>
            {MUSCLES.map((m) => (
              <Pill
                key={m}
                label={tMaybe(`muscles.${m}`) ?? m}
                selected={filters.muscles.includes(m)}
                onPress={() => setFilters({ ...filters, muscles: toggle(filters.muscles, m) })}
              />
            ))}
          </Chips>
        </Section>
        <Section title={t('filters.equipment')}>
          <Chips>
            {EQUIPMENT.map((e) => (
              <Pill
                key={e}
                label={tMaybe(`equipment.${e}`) ?? e}
                selected={filters.equipment.includes(e)}
                onPress={() => setFilters({ ...filters, equipment: toggle(filters.equipment, e) })}
              />
            ))}
          </Chips>
        </Section>
        <Section title={t('filters.types')}>
          <Chips>
            {TYPES.map((ty) => (
              <Pill
                key={ty}
                label={tMaybe(`exerciseTypes.${ty}`) ?? ty}
                selected={filters.types.includes(ty)}
                onPress={() => setFilters({ ...filters, types: toggle(filters.types, ty) })}
              />
            ))}
          </Chips>
        </Section>
        <Section title={t('filters.other')}>
          <Chips>
            <Pill
              label={t('filters.onlyCustom')}
              selected={filters.onlyCustom}
              onPress={() => setFilters({ ...filters, onlyCustom: !filters.onlyCustom })}
            />
            <Pill
              label={t('filters.showHidden')}
              selected={filters.showHidden}
              onPress={() => setFilters({ ...filters, showHidden: !filters.showHidden })}
            />
          </Chips>
        </Section>
      </ScrollView>
      <FloatingButton label={t('filters.show', { count })} onPress={() => router.back()} />
    </View>
  );
}
