import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import { setWorkoutNote } from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import { formatClock } from '@/domain/workout';
import { formatNumber, t } from '@/i18n';
import { dayName } from '@/features/today/format';
import { WeekRing } from '@/features/today/WeekRing';
import { loadSummary } from '@/features/workout/summaryData';
import { useTheme } from '@/theme';

/** Podsumowanie po „Zakończ” (makieta design/v2/Podsumowanie): domknięty segment tygodnia, liczby, rekordy. */
export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { colors, space, size, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const floatingSpace = useFloatingButtonSpace();
  const { data } = useDbQuery((d) => loadSummary(d, id), `summary:${id}`);
  const [note, setNote] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);

  const close = async () => {
    if (note !== null) await setWorkoutNote(db, id, note);
    // Bez historii (np. otwarte z linku) wracamy na „Dziś”.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!data) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const { session, summary, records, week, previousVolumeKg } = data;
  const name = session.name ?? t('workout.emptyName');
  const volume = Math.round(summary.volumeKg);
  // Ten trening to ostatni pełny segment; ponad cel pierścień jest po prostu pełny.
  const closingIndex = week.done >= 1 && week.done <= week.target ? week.done - 1 : null;

  const stats = [
    { label: t('workout.summary.duration'), value: formatClock(summary.durationSec) },
    {
      label: t('workout.summary.volume'),
      value: volume > 0 ? t('units.kg', { value: formatNumber(volume) }) : '—',
    },
    { label: t('workout.summary.setsShort'), value: String(summary.setCount) },
  ];

  const diff = previousVolumeKg != null ? volume - Math.round(previousVolumeKg) : null;
  const kicker = (text: string) => (
    <Text
      variant="caption2"
      color="label2"
      style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}
    >
      {text}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingHorizontal: space.md,
          paddingBottom: floatingSpace,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <WeekRing
          size={size.summaryRing}
          stroke={size.summaryRingStroke}
          segments={week.target}
          filled={week.done}
          closingIndex={closingIndex}
          accessibilityLabel={t('workout.summary.ring', { done: week.done, total: week.target })}
        >
          <Icon
            name={{ ios: 'checkmark', web: 'check' }}
            color={colors.accentText}
            size={size.touchMin + space.sm}
          />
        </WeekRing>

        <Text
          variant="brandXL"
          accessibilityRole="header"
          style={{ textAlign: 'center', marginTop: space.md }}
        >
          {t('workout.summary.titleDone', { name })}
        </Text>
        <Text
          variant="footnote"
          color="label2"
          style={{ textAlign: 'center', marginTop: space.xxs / 2 }}
        >
          {t('workout.summary.weekLine', {
            n: week.done,
            total: week.target,
            date: dayName(new Date(session.startedAt)),
          })}
        </Text>

        <View style={{ flexDirection: 'row', marginTop: space.xl }}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              accessible
              accessibilityLabel={t('workout.summary.stat', s)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: space.xxs / 2,
                borderLeftWidth: i ? 1 : 0,
                borderLeftColor: colors.separator,
              }}
            >
              <Text variant="brandM" numberOfLines={1} adjustsFontSizeToFit>
                {s.value}
              </Text>
              {kicker(s.label)}
            </View>
          ))}
        </View>

        <Card style={{ marginTop: space.xl, paddingBottom: space.xxs }}>
          <View accessibilityRole="header">{kicker(t('workout.summary.records'))}</View>
          {records.length ? (
            records.map((r, i) => (
              <View
                key={r.exerciseName}
                accessible
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  minHeight: size.touchMin + space.md,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.separator,
                }}
              >
                <View
                  style={{
                    width: size.touchMin - space.xs,
                    height: size.touchMin - space.xs,
                    borderRadius: radius.capsule,
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={{ ios: 'trophy', web: 'emoji_events' }}
                    color={colors.accentText}
                    size={size.iconSmall}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="headline" numberOfLines={1}>
                    {r.exerciseName}
                  </Text>
                  <Text variant="footnote" color="label2">
                    {r.kinds.map((k) => t(`records.${k}`)).join(', ')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text variant="subheadline" color="label2" style={{ paddingVertical: space.sm }}>
              {t('workout.summary.noRecords')}
            </Text>
          )}
        </Card>

        {diff != null && previousVolumeKg != null ? (
          <Card style={{ marginTop: space.sm }} accessible>
            {kicker(t('workout.summary.compareTitle', { name }))}
            <Text
              variant="brandM"
              color={diff > 0 ? 'success' : 'label'}
              style={{ marginTop: space.xxs }}
            >
              {diff > 0
                ? t('workout.summary.compareMore', { value: formatNumber(diff) })
                : diff < 0
                  ? t('workout.summary.compareLess', { value: formatNumber(-diff) })
                  : t('workout.summary.compareSame')}
            </Text>
            <Text variant="footnote" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
              {t('workout.summary.compareBody', {
                today: formatNumber(volume),
                previous: formatNumber(Math.round(previousVolumeKg)),
              })}
            </Text>
          </Card>
        ) : null}

        <View style={{ marginTop: space.sm }}>
          {noteOpen || session.note ? (
            <TextField
              label={t('workout.summary.note')}
              placeholder={t('workout.summary.notePlaceholder')}
              value={note ?? session.note ?? ''}
              onChangeText={setNote}
              multiline
              autoFocus={noteOpen && !session.note}
            />
          ) : (
            <View style={{ alignSelf: 'center' }}>
              <Button
                variant="text"
                label={t('workout.summary.addNote')}
                onPress={() => setNoteOpen(true)}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <FloatingButton label={t('workout.summary.done')} onPress={() => void close()} />
    </View>
  );
}
