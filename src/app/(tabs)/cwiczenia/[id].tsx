import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { IllustrationPlaceholder } from '@/components/IllustrationPlaceholder';
import { MetricTile } from '@/components/MetricTile';
import { Pill } from '@/components/Pill';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { HeaderMenuButton } from '@/components/MenuButtons';
import { confirmDestructive, type MenuItem } from '@/components/stack';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import type { Exercise } from '@/data/models';
import { exercisePlanCount, getExercise, setExerciseHidden } from '@/data/repositories/exercises';
import { exerciseHistory, lastSetsForExercise } from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import type { HistorySet } from '@/domain/records';
import { exerciseName } from '@/features/exercises/search';
import {
  exerciseSummary,
  historyByWorkout,
  recordList,
  type TopSet,
} from '@/features/exercises/summary';
import { formatDuration } from '@/features/plans/format';
import { formatNumber, t, tList, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

type Tab = 'guide' | 'history' | 'records';

function setLabel(set: Pick<TopSet, 'weightKg' | 'reps' | 'durationSec'>): string {
  if (set.durationSec != null) return formatDuration(set.durationSec);
  if (set.weightKg != null && set.reps != null) {
    return t('exercise.setLine', { weight: formatNumber(set.weightKg), reps: set.reps });
  }
  if (set.reps != null) return t('exercise.repsLine', { reps: set.reps });
  return '—';
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('pl', { day: 'numeric', month: 'long', year: 'numeric' });
}

function BulletList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: space.xs }}>
          <Text variant="body" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
            {ordered ? `${index + 1}.` : '•'}
          </Text>
          <Text variant="body" style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GuideTab({ exercise }: { exercise: Exercise }) {
  const { space } = useTheme();
  const steps = tList(`exerciseGuides.${exercise.id}.steps`);
  const mistakes = tList(`exerciseGuides.${exercise.id}.mistakes`);
  const muscles = (list: string[]) => list.map((m) => tMaybe(`muscles.${m}`) ?? m).join(', ');

  return (
    <View style={{ gap: space.sm }}>
      {steps.length ? (
        <Card style={{ gap: space.sm }}>
          <Text variant="headline" accessibilityRole="header">
            {t('exercise.howTo')}
          </Text>
          <BulletList items={steps} ordered />
          {mistakes.length ? (
            <>
              <Text variant="headline" accessibilityRole="header">
                {t('exercise.mistakes')}
              </Text>
              <BulletList items={mistakes} />
            </>
          ) : null}
        </Card>
      ) : exercise.source === 'user' && !exercise.note ? (
        <EmptyState title={t('exercise.guideMissingTitle')} body={t('exercise.guideMissingBody')} />
      ) : null}
      {exercise.note ? (
        <Card>
          <Text variant="headline" accessibilityRole="header">
            {t('exercise.note')}
          </Text>
          <Text variant="body">{exercise.note}</Text>
        </Card>
      ) : null}
      <Card accessible>
        <Text variant="footnote" color="label2">
          {t('exercise.primary')}
        </Text>
        <Text variant="body">{muscles(exercise.primaryMuscles)}</Text>
        {exercise.secondaryMuscles.length ? (
          <>
            <Text variant="footnote" color="label2">
              {t('exercise.secondary')}
            </Text>
            <Text variant="body">{muscles(exercise.secondaryMuscles)}</Text>
          </>
        ) : null}
      </Card>
    </View>
  );
}

function HistoryTab({ history }: { history: HistorySet[] }) {
  const { space } = useTheme();
  const workouts = historyByWorkout(history);
  if (!workouts.length) {
    return (
      <EmptyState title={t('exercise.historyEmptyTitle')} body={t('exercise.historyEmptyBody')} />
    );
  }
  return (
    <View style={{ gap: space.xs }}>
      {workouts.map((workout) => (
        <Card key={workout.workoutId} accessible>
          <Text variant="headline">{dateLabel(workout.date)}</Text>
          <Text variant="subheadline" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
            {workout.sets
              .map((set) =>
                setLabel({
                  weightKg: set.weightKg ?? null,
                  reps: set.reps ?? null,
                  durationSec: set.durationSec ?? null,
                }),
              )
              .join(' · ')}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function RecordsTab({ exercise, history }: { exercise: Exercise; history: HistorySet[] }) {
  const { space } = useTheme();
  const records = recordList(exercise.type, history);
  if (!records.length) {
    return (
      <EmptyState title={t('exercise.recordsEmptyTitle')} body={t('exercise.recordsEmptyBody')} />
    );
  }
  return (
    <View style={{ gap: space.xs }}>
      {records.map((record) => {
        const value =
          record.kind === 'longestDuration'
            ? formatDuration(record.value)
            : record.kind === 'mostReps'
              ? t('exercise.repsLine', { reps: record.value })
              : t('units.kg', { value: formatNumber(Math.round(record.value * 10) / 10) });
        return (
          <Card
            key={record.kind}
            accessible
            style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}
          >
            <View style={{ flex: 1, gap: space.xxs }}>
              <Text variant="body">{t(`records.${record.kind}`)}</Text>
              <Text variant="footnote" color="label2">
                {dateLabel(record.date)}
              </Text>
            </View>
            <Text variant="headline" style={{ fontVariant: ['tabular-nums'] }}>
              {value}
            </Text>
          </Card>
        );
      })}
    </View>
  );
}

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const bottom = useFloatingButtonSpace();
  const [tab, setTab] = useState<Tab>('guide');

  const { data, loading, reload } = useDbQuery(async (database) => {
    const exercise = await getExercise(database, id);
    if (!exercise) return null;
    const [history, lastSets] = await Promise.all([
      exerciseHistory(database, id),
      lastSetsForExercise(database, id),
    ]);
    return { exercise, history, lastSets };
  }, `exercise-${id}`);

  if (loading || data === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={3} />
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

  const { exercise, history, lastSets } = data;
  const name = exerciseName(exercise);
  const summary = exerciseSummary(exercise.type, history, lastSets);
  const headline = summary.headline;
  const headlineValue =
    headline.value == null
      ? null
      : headline.kind === 'longestDuration'
        ? formatDuration(headline.value)
        : formatNumber(Math.round(headline.value * 10) / 10);
  const headlineUnit =
    headline.kind === 'bestOneRepMax'
      ? t('planExercise.unitKg')
      : headline.kind === 'mostReps'
        ? t('planExercise.unitReps')
        : undefined;

  const toggleHidden = async () => {
    await setExerciseHidden(db, exercise.id, !exercise.isHidden);
    await reload();
  };
  const menu: MenuItem[] = [
    ...(exercise.source === 'user'
      ? [
          {
            label: t('common.edit'),
            onPress: () =>
              router.push({ pathname: '/cwiczenia/nowe', params: { id: exercise.id } }),
          },
        ]
      : []),
    {
      label: exercise.isHidden ? t('exercise.unhide') : t('exercise.hide'),
      onPress: async () => {
        if (exercise.isHidden) return void toggleHidden();
        const plans = await exercisePlanCount(db, exercise.id);
        if (!plans) return void toggleHidden();
        confirmDestructive(
          t('exercise.hide'),
          t('exercise.hideInPlans', { count: plans }),
          t('exercise.hideConfirm'),
          () => void toggleHidden(),
        );
      },
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderMenuButton label={t('common.more')} title={name} items={menu} />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.screen, paddingBottom: bottom, gap: space.lg }}
      >
        <IllustrationPlaceholder exerciseName={name} />
        <View style={{ gap: space.sm }}>
          <Text variant="title1" accessibilityRole="header">
            {name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
            {[...exercise.primaryMuscles, ...exercise.secondaryMuscles].map((m) => (
              <Pill key={m} label={tMaybe(`muscles.${m}`) ?? m} />
            ))}
            <Pill label={tMaybe(`equipment.${exercise.equipment}`) ?? exercise.equipment} />
          </View>
          {exercise.isHidden ? (
            <Text variant="footnote" color="label2">
              {t('exercise.hiddenInfo')}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <MetricTile
            label={t(`exercise.${headline.kind === 'bestOneRepMax' ? 'oneRepMax' : headline.kind}`)}
            value={headlineValue}
            unit={headlineUnit}
            emptyLabel={t('exercise.noData')}
          />
          <MetricTile
            label={t('exercise.last')}
            value={summary.last ? setLabel(summary.last) : null}
            emptyLabel={t('exercise.noData')}
          />
        </View>
        <SegmentedControl<Tab>
          accessibilityLabel={t('exercise.sections')}
          value={tab}
          onChange={setTab}
          options={[
            { key: 'guide', label: t('exercise.tabGuide') },
            { key: 'history', label: t('exercise.tabHistory') },
            { key: 'records', label: t('exercise.tabRecords') },
          ]}
        />
        {tab === 'guide' ? <GuideTab exercise={exercise} /> : null}
        {tab === 'history' ? <HistoryTab history={history} /> : null}
        {tab === 'records' ? <RecordsTab exercise={exercise} history={history} /> : null}
      </ScrollView>
      <FloatingButton
        label={t('exercise.addToPlan')}
        icon={{ ios: 'plus', web: 'add' }}
        onPress={() =>
          router.push({ pathname: '/cwiczenia/dodaj', params: { exerciseId: exercise.id } })
        }
      />
    </View>
  );
}
