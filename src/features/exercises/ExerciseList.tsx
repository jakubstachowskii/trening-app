import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';

import { useFloatingButtonSpace } from '@/components/Button';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { t, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

import { exerciseIcon } from './icons';
import { type ExerciseSection, groupByLetter, type NamedExercise } from './search';

type Props = {
  /** Już przefiltrowane i posortowane. */
  exercises: NamedExercise[];
  /** Przy wpisanym zapytaniu lista bez liter (kolejność według trafności). */
  grouped: boolean;
  onSelect: (exercise: NamedExercise) => void;
  header?: ReactElement;
  empty?: ReactElement;
  /** Zapas pod listą na pływający przycisk. */
  floatingSpace?: boolean;
};

/** Podtytuł wiersza: główne mięśnie · sprzęt (+ „własne”, „ukryte”). */
export function exerciseSubtitle(exercise: NamedExercise): string {
  const muscles = exercise.primaryMuscles.map((m) => tMaybe(`muscles.${m}`) ?? m).join(', ');
  const parts = [muscles, tMaybe(`equipment.${exercise.equipment}`) ?? exercise.equipment];
  if (exercise.source === 'user') parts.push(t('exerciseList.customTag'));
  if (exercise.isHidden) parts.push(t('exerciseList.hiddenTag'));
  return parts.filter(Boolean).join(' · ');
}

export function ExerciseList({
  exercises,
  grouped,
  onSelect,
  header,
  empty,
  floatingSpace,
}: Props) {
  const { colors, space } = useTheme();
  const bottomSpace = useFloatingButtonSpace();
  const sections: ExerciseSection[] = grouped
    ? groupByLetter(exercises)
    : exercises.length
      ? [{ title: '', data: exercises }]
      : [];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: space.xs,
        paddingBottom: floatingSpace ? bottomSpace : space.section,
        gap: space.lg,
      }}
      data={sections}
      keyExtractor={(section) => section.title || 'wyniki'}
      initialNumToRender={4}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item: section }) => (
        <View style={{ gap: space.xs }}>
          {section.title ? (
            <Text
              variant="footnote"
              color="label2"
              accessibilityRole="header"
              style={{ paddingHorizontal: space.xxs }}
            >
              {section.title}
            </Text>
          ) : null}
          <ListGroup>
            {section.data.map((exercise) => (
              <ListRow
                key={exercise.id}
                title={exercise.displayName}
                subtitle={exerciseSubtitle(exercise)}
                icon={exerciseIcon(exercise.type, exercise.equipment)}
                onPress={() => onSelect(exercise)}
              />
            ))}
          </ListGroup>
        </View>
      )}
    />
  );
}
