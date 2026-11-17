import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ListGroup, ListRow } from '@/components/ListRow';
import { HeaderMenuButton } from '@/components/MenuButtons';
import { MetricTile } from '@/components/MetricTile';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { confirmDestructive } from '@/components/stack';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { deleteWorkout } from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import { formatClock } from '@/domain/workout';
import { formatSetValues, loadSession } from '@/features/workout/session';
import { summarizeSession } from '@/features/workout/summaryData';
import { formatNumber, t } from '@/i18n';
import { useTheme } from '@/theme';

/** Zrobiony trening z historii: liczby i wszystkie serie (tylko do odczytu), z usuwaniem. */
export default function HistoryWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const { data: session, loading } = useDbQuery((d) => loadSession(d, id), `history-${id}`);

  if (loading && session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={4} />
      </View>
    );
  }
  if (!session || !session.finishedAt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <EmptyState title={t('common.notFound')} body="" />
      </View>
    );
  }

  const summary = summarizeSession(session);
  const name = session.name ?? t('workout.emptyName');
  const date = new Date(session.startedAt).toLocaleDateString('pl', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const remove = () =>
    confirmDestructive(
      t('progress.deleteTitle', { name }),
      t('progress.deleteBody'),
      t('common.delete'),
      async () => {
        await deleteWorkout(db, session.id);
        router.back();
      },
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderMenuButton
              label={t('common.more')}
              title={name}
              items={[{ label: t('progress.delete'), onPress: remove, destructive: true }]}
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.screen, gap: space.section }}
      >
        <View style={{ gap: space.xxs }}>
          <Text variant="brandL" accessibilityRole="header">
            {name}
          </Text>
          <Text variant="subheadline" color="label2">
            {date.charAt(0).toUpperCase() + date.slice(1)}
          </Text>
        </View>
        {summary ? (
          <View style={{ flexDirection: 'row', gap: space.xs }}>
            <MetricTile
              label={t('progress.time')}
              value={formatClock(summary.durationSec)}
              emptyLabel={t('stepper.empty')}
            />
            <MetricTile
              label={t('progress.volume')}
              value={formatNumber(Math.round(summary.volumeKg))}
              unit="kg"
              emptyLabel={t('stepper.empty')}
            />
            <MetricTile
              label={t('progress.sets')}
              value={formatNumber(summary.setCount)}
              emptyLabel={t('stepper.empty')}
            />
          </View>
        ) : null}
        {session.exercises.map((e) => (
          <Section key={e.id} title={e.name}>
            <ListGroup>
              {e.sets.map((set, i) => (
                <ListRow
                  key={set.id}
                  title={t('progress.setTitle', { n: i + 1 })}
                  subtitle={formatSetValues(e.exercise.type, set)}
                  showChevron={false}
                />
              ))}
            </ListGroup>
          </Section>
        ))}
        {session.note ? (
          <Section title={t('progress.note')}>
            <Text variant="body">{session.note}</Text>
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}
