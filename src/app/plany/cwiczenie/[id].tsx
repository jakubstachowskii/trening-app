import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { NumberStepper } from '@/components/NumberStepper';
import { Skeleton } from '@/components/Skeleton';
import { confirmDestructive } from '@/components/stack';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import type { Exercise, PlanExercise } from '@/data/models';
import { getExercise } from '@/data/repositories/exercises';
import { deletePlanExercise, getPlanExercise, updatePlanExercise } from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { exerciseName } from '@/features/exercises/search';
import { validatePlanTarget } from '@/features/plans/validate';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

function Form({ item, exercise }: { item: PlanExercise; exercise: Exercise }) {
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const timed = exercise.type === 'time';
  const withWeight = exercise.type === 'weight_reps' || exercise.type === 'weighted_bodyweight';

  const [sets, setSets] = useState<number | null>(item.targetSets);
  const [repsMin, setRepsMin] = useState(item.repsMin);
  const [repsMax, setRepsMax] = useState(item.repsMax);
  const [duration, setDuration] = useState(item.targetDurationSec);
  const [weight, setWeight] = useState(item.targetWeightKg);
  const [rest, setRest] = useState(item.restSec);
  const [note, setNote] = useState(item.note ?? '');

  const target = {
    targetSets: sets ?? 1,
    repsMin: timed ? null : repsMin,
    repsMax: timed ? null : repsMax,
    targetDurationSec: timed ? duration : null,
    targetWeightKg: withWeight ? weight : null,
    restSec: rest,
    note,
  };
  const error = validatePlanTarget(target);

  const save = async () => {
    if (error) return;
    await updatePlanExercise(db, item.id, target);
    router.back();
  };

  const remove = () =>
    confirmDestructive(
      t('planDay.removeTitle', { name: exerciseName(exercise) }),
      '',
      t('planDay.removeExercise'),
      async () => {
        await deletePlanExercise(db, item.id);
        router.back();
      },
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="text"
              label={t('common.save')}
              disabled={Boolean(error)}
              onPress={() => void save()}
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.screen, gap: space.lg }}
      >
        <Text variant="title2" accessibilityRole="header">
          {exerciseName(exercise)}
        </Text>
        <NumberStepper
          label={t('planExercise.sets')}
          value={sets}
          onChange={setSets}
          min={1}
          max={20}
        />
        {timed ? (
          <NumberStepper
            label={t('planExercise.duration')}
            value={duration}
            onChange={setDuration}
            step={5}
            min={5}
            max={3600}
            unit={t('planExercise.unitSec')}
          />
        ) : (
          <View style={{ gap: space.lg }}>
            <NumberStepper
              label={t('planExercise.repsMin')}
              value={repsMin}
              onChange={setRepsMin}
              min={1}
              max={100}
              optional
              unit={t('planExercise.unitReps')}
            />
            <NumberStepper
              label={t('planExercise.repsMax')}
              value={repsMax}
              onChange={setRepsMax}
              min={1}
              max={100}
              optional
              unit={t('planExercise.unitReps')}
            />
          </View>
        )}
        {withWeight ? (
          <NumberStepper
            label={`${t('planExercise.weight')} (${t('common.optional')})`}
            value={weight}
            onChange={setWeight}
            step={2.5}
            min={0}
            max={1000}
            decimal
            optional
            unit={t('planExercise.unitKg')}
          />
        ) : null}
        <NumberStepper
          label={t('planExercise.rest')}
          value={rest}
          onChange={setRest}
          step={15}
          min={0}
          max={900}
          optional
          unit={t('planExercise.unitSec')}
        />
        {error ? (
          <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
            {t(error)}
          </Text>
        ) : null}
        <TextField
          label={`${t('planExercise.note')} (${t('common.optional')})`}
          value={note}
          onChangeText={setNote}
          multiline
        />
        <Button label={t('common.save')} disabled={Boolean(error)} onPress={() => void save()} />
        <Button variant="destructive" label={t('planDay.removeExercise')} onPress={remove} />
      </ScrollView>
    </View>
  );
}

/** Arkusz z parametrami ćwiczenia w dniu planu. */
export default function PlanExerciseSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space } = useTheme();
  const { data, loading } = useDbQuery(async (db) => {
    const item = await getPlanExercise(db, id);
    if (!item) return null;
    const exercise = await getExercise(db, item.exerciseId);
    return exercise ? { item, exercise } : null;
  }, `plan-exercise-${id}`);

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
  return <Form item={data.item} exercise={data.exercise} />;
}
