import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MetricTile } from '@/components/MetricTile';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import { setWorkoutNote } from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import { formatClock } from '@/domain/workout';
import { formatNumber, t } from '@/i18n';
import { loadSummary } from '@/features/workout/summaryData';
import { useTheme } from '@/theme';

/** Podsumowanie po „Zakończ”: czas, objętość, serie, nowe rekordy, notatka. */
export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { colors, space, size } = useTheme();
  const insets = useSafeAreaInsets();
  const floatingSpace = useFloatingButtonSpace();
  const { data } = useDbQuery((d) => loadSummary(d, id), `summary:${id}`);
  const [note, setNote] = useState<string | null>(null);

  const close = async () => {
    if (note !== null) await setWorkoutNote(db, id, note);
    router.back();
  };

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const { session, summary, records } = data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.md,
          paddingBottom: floatingSpace,
          gap: space.section,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: space.xxs }}>
          <Text variant="footnote" color="label2">
            {session.name ?? t('workout.emptyName')}
          </Text>
          <Text variant="largeTitle" accessibilityRole="header">
            {t('workout.summary.title')}
          </Text>
        </View>

        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <MetricTile
              label={t('workout.summary.duration')}
              value={formatClock(summary.durationSec)}
              emptyLabel=""
            />
            <MetricTile
              label={t('workout.summary.volume')}
              value={summary.volumeKg > 0 ? formatNumber(Math.round(summary.volumeKg)) : null}
              unit="kg"
              emptyLabel={t('workout.emptyValue')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <MetricTile
              label={t('workout.summary.sets')}
              value={String(summary.setCount)}
              emptyLabel=""
            />
            <MetricTile
              label={t('workout.summary.exercises')}
              value={String(summary.exerciseCount)}
              emptyLabel=""
            />
          </View>
        </View>

        <View style={{ gap: space.xs }}>
          <Text
            variant="headline"
            accessibilityRole="header"
            style={{ paddingHorizontal: space.xxs }}
          >
            {t('workout.summary.records')}
          </Text>
          <Card>
            {records.length ? (
              records.map((r) => (
                <View
                  key={r.exerciseName}
                  accessible
                  style={{
                    flexDirection: 'row',
                    gap: space.sm,
                    alignItems: 'center',
                    minHeight: size.touchMin,
                  }}
                >
                  <Icon
                    name={{ ios: 'trophy.fill', web: 'emoji_events' }}
                    color={colors.accentText}
                    size={size.iconSmall}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="headline">{r.exerciseName}</Text>
                    <Text variant="footnote" color="label2">
                      {r.kinds.map((k) => t(`records.${k}`)).join(', ')}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="subheadline" color="label2">
                {t('workout.summary.noRecords')}
              </Text>
            )}
          </Card>
        </View>

        <TextField
          label={t('workout.summary.note')}
          placeholder={t('workout.summary.notePlaceholder')}
          value={note ?? session.note ?? ''}
          onChangeText={setNote}
          multiline
        />
      </ScrollView>
      <FloatingButton label={t('workout.summary.done')} onPress={() => void close()} />
    </View>
  );
}
