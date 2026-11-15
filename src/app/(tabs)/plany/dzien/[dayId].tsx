import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListRow } from '@/components/ListRow';
import { ReorderableRows } from '@/components/Reorderable';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { confirmDestructive, HeaderIconButton, showMenu } from '@/components/stack';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import type { Exercise, PlanExercise } from '@/data/models';
import { listExercises } from '@/data/repositories/exercises';
import {
  deletePlanDay,
  deletePlanExercise,
  getPlanDay,
  renamePlanDay,
  reorderPlanExercises,
} from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { exerciseIcon } from '@/features/exercises/icons';
import { exerciseName } from '@/features/exercises/search';
import { formatPlanExercise } from '@/features/plans/format';
import { beginWorkout } from '@/features/workout/startWorkout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

function NameField({ initial, onSave }: { initial: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const commit = () => {
    if (!name.trim()) {
      setError(t('planDay.nameRequired'));
      setName(initial);
      return;
    }
    setError(null);
    if (name.trim() !== initial) onSave(name.trim());
  };
  return (
    <TextField
      label={t('planDay.rename')}
      value={name}
      onChangeText={setName}
      onEndEditing={commit}
      onBlur={commit}
      returnKeyType="done"
      error={error}
    />
  );
}

export default function PlanDayScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const bottom = useFloatingButtonSpace();
  const [order, setOrder] = useState<PlanExercise[] | null>(null);

  const { data, loading, reload } = useDbQuery(async (database) => {
    const day = await getPlanDay(database, dayId);
    if (!day) return null;
    const exercises = await listExercises(database, { includeHidden: true });
    return { day, byId: new Map<string, Exercise>(exercises.map((e) => [e.id, e])) };
  }, `day-${dayId}`);

  if (loading || data === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={4} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <EmptyState title={t('common.notFound')} body="" />
      </View>
    );
  }

  const { day, byId } = data;
  const items = order ?? day.exercises;
  const nameOf = (item: PlanExercise) => {
    const exercise = byId.get(item.exerciseId);
    return exercise ? exerciseName(exercise) : item.exerciseId;
  };

  const reorder = async (next: PlanExercise[]) => {
    setOrder(next);
    try {
      await reorderPlanExercises(
        db,
        day.id,
        next.map((item) => item.id),
      );
    } finally {
      await reload();
      setOrder(null);
    }
  };

  const removeItem = (item: PlanExercise) =>
    confirmDestructive(
      t('planDay.removeTitle', { name: nameOf(item) }),
      '',
      t('planDay.removeExercise'),
      async () => {
        await deletePlanExercise(db, item.id);
        await reload();
      },
    );

  const removeDay = () =>
    confirmDestructive(
      t('planDay.deleteTitle', { name: day.name }),
      t('planDay.deleteBody'),
      t('common.delete'),
      async () => {
        await deletePlanDay(db, day.id);
        router.back();
      },
    );

  const addExercise = () => router.push({ pathname: '/plany/wybierz', params: { dayId: day.id } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: day.name,
          headerRight: () => (
            <HeaderIconButton
              icon={{ ios: 'ellipsis', web: 'more_horiz' }}
              label={t('common.more')}
              onPress={() =>
                showMenu(day.name, [
                  { label: t('planDay.delete'), onPress: removeDay, destructive: true },
                ])
              }
            />
          ),
        }}
      />
      <ReorderableRows
        data={items}
        keyOf={(item) => item.id}
        onReorder={(next) => void reorder(next)}
        bottomSpace={bottom}
        header={
          <View style={{ gap: space.section, paddingBottom: space.xs }}>
            <NameField
              key={day.name}
              initial={day.name}
              onSave={async (name) => {
                await renamePlanDay(db, day.id, name);
                await reload();
              }}
            />
            <Section title={t('planDay.exercises')}>{null}</Section>
          </View>
        }
        footer={
          <View style={{ gap: space.section, paddingTop: space.xs }}>
            {items.length > 1 ? (
              <Text variant="footnote" color="label2" style={{ paddingHorizontal: space.xxs }}>
                {t('reorder.hint')}
              </Text>
            ) : null}
            {items.length ? (
              <Button
                variant="secondary"
                label={t('planDay.addExercise')}
                icon={{ ios: 'plus', web: 'add' }}
                onPress={addExercise}
              />
            ) : null}
            <Button variant="destructive" label={t('planDay.delete')} onPress={removeDay} />
          </View>
        }
        empty={
          <EmptyState
            title={t('planDay.emptyTitle')}
            body={t('planDay.emptyBody')}
            action={{ label: t('planDay.addExercise'), onPress: addExercise }}
          />
        }
        renderRow={(item, controls) => {
          const exercise = byId.get(item.exerciseId);
          return (
            <ListRow
              title={nameOf(item)}
              subtitle={formatPlanExercise(item)}
              icon={exercise ? exerciseIcon(exercise.type, exercise.equipment) : undefined}
              actions={[
                ...controls.actions,
                {
                  name: 'remove',
                  label: t('planDay.removeExercise'),
                  onAction: () => removeItem(item),
                },
              ]}
              onLongPress={controls.drag}
              delayLongPress={500}
              onPress={() =>
                router.push({ pathname: '/plany/cwiczenie/[id]', params: { id: item.id } })
              }
            />
          );
        }}
      />
      {items.length ? (
        <FloatingButton
          label={t('workout.start.startDay')}
          icon={{ ios: 'play.fill', web: 'play_arrow' }}
          onPress={() => void beginWorkout(db, day.id)}
        />
      ) : null}
    </View>
  );
}
