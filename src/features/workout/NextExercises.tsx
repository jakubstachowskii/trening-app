import { View } from 'react-native';

import { ListGroup, ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { nextPendingSetIndex } from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { exerciseMeta, type SessionExercise } from './session';

type Props = {
  exercises: SessionExercise[];
  current: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
};

/** „Następne”: pozostałe ćwiczenia w kolejności po bieżącym; stuknięcie przechodzi do ćwiczenia. */
export function NextExercises({ exercises, current, onSelect, onAdd }: Props) {
  const { space } = useTheme();
  const order = exercises
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== current)
    .sort(
      (a, b) =>
        ((a.index - current + exercises.length) % exercises.length) -
        ((b.index - current + exercises.length) % exercises.length),
    );

  return (
    <View style={{ gap: space.xs }}>
      {order.length ? (
        <>
          <Text
            variant="footnote"
            color="label2"
            accessibilityRole="header"
            style={{ paddingHorizontal: space.md, fontWeight: '600' }}
          >
            {t('workout.next')}
          </Text>
          <ListGroup>
            {order.map(({ item, index }) => {
              const finished = nextPendingSetIndex(item) === -1;
              return (
                <ListRow
                  key={item.id}
                  title={item.name}
                  subtitle={
                    finished
                      ? `${exerciseMeta(item)} · ${t('workout.setDone')}`
                      : exerciseMeta(item)
                  }
                  accessibilityHint={t('workout.openExercise')}
                  onPress={() => onSelect(index)}
                />
              );
            })}
          </ListGroup>
        </>
      ) : null}
      <ListGroup>
        <ListRow
          icon={{ ios: 'plus', web: 'add' }}
          title={t('workout.addExercise')}
          onPress={onAdd}
        />
      </ListGroup>
    </View>
  );
}
