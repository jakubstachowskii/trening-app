import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { useDbQuery } from '@/data/useDbQuery';
import { elapsedSec, formatClock } from '@/domain/workout';
import { t, tPlural } from '@/i18n';
import { loadStartData } from '@/features/workout/startData';
import { beginWorkout, openWorkout } from '@/features/workout/startWorkout';
import { useNow } from '@/features/workout/useNow';
import { useTheme } from '@/theme';

/** Start (makieta F2-Start): następny trening z aktywnego planu i trening w toku. Tydzień i rekordy: F7. */
export default function StartScreen() {
  const db = useDb();
  const { space } = useTheme();
  const { data, loading } = useDbQuery((d) => loadStartData(d), 'start');
  const [busy, setBusy] = useState(false);
  const now = useNow(1000, Boolean(data?.unfinished));

  const begin = async (dayId?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await beginWorkout(db, dayId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('screens.start.title')}>
      {loading || !data ? (
        <Skeleton rows={3} />
      ) : (
        <>
          {data.unfinished ? (
            <Card style={{ gap: space.sm }}>
              <View accessible style={{ gap: space.xxs }}>
                <Text variant="footnote" color="label2">
                  {t('workout.start.resumeTitle')}
                </Text>
                <Text variant="title2">{data.unfinished.name ?? t('workout.emptyName')}</Text>
                <Text
                  variant="subheadline"
                  color="label2"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatClock(elapsedSec(data.unfinished.startedAt, now))}
                </Text>
              </View>
              <Button label={t('workout.start.resume')} onPress={openWorkout} />
            </Card>
          ) : null}

          {data.plan && data.nextDay ? (
            <Card style={{ gap: space.xs, padding: space.lg }}>
              <Text variant="footnote" color="label2">
                {t('workout.start.nextTitle')}
              </Text>
              <Text variant="title1" accessibilityRole="header">
                {data.nextDay.name}
              </Text>
              <Text variant="subheadline" color="label2">
                {data.plan.name}
              </Text>
              <Text variant="subheadline" color="label2">
                {data.nextDay.exercises.length
                  ? tPlural('units.exercises', data.nextDay.exercises.length)
                  : t('workout.start.dayEmpty')}
              </Text>
              {data.unfinished ? null : (
                <View style={{ marginTop: space.xxs }}>
                  <Button
                    label={t('workout.start.startDay')}
                    accessibilityLabel={t('workout.start.startLabel', { name: data.nextDay.name })}
                    disabled={busy || data.nextDay.exercises.length === 0}
                    onPress={() => void begin(data.nextDay?.id)}
                  />
                </View>
              )}
            </Card>
          ) : data.unfinished ? null : (
            <EmptyState
              title={t('workout.start.noPlanTitle')}
              body={t('workout.start.noPlanBody')}
              action={{
                label: t('workout.start.choosePlan'),
                onPress: () => router.navigate('/plany'),
              }}
            />
          )}

          {data.unfinished ? null : (
            <Button
              variant="secondary"
              label={t('workout.start.empty')}
              icon={{ ios: 'plus', web: 'add' }}
              disabled={busy}
              onPress={() => void begin()}
            />
          )}
        </>
      )}
    </Screen>
  );
}
