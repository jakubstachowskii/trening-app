import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { HeaderIconButton } from '@/components/stack';
import { Text } from '@/components/Text';
import { elapsedSec, formatClock } from '@/domain/workout';
import { t } from '@/i18n';
import { CurrentExercise } from '@/features/workout/CurrentExercise';
import { KeepAwake } from '@/features/workout/KeepAwake';
import { Keypad } from '@/features/workout/Keypad';
import { NextExercises } from '@/features/workout/NextExercises';
import { RecordToast } from '@/features/workout/RecordToast';
import { RestTimer } from '@/features/workout/RestTimer';
import { useNow } from '@/features/workout/useNow';
import { useWorkoutSession } from '@/features/workout/useWorkoutSession';
import { useTheme } from '@/theme';

/** Trening w toku (makieta design/f2/F2-Trening). Zapis na bieżąco, więc „Zwiń” niczego nie traci. */
export default function WorkoutScreen() {
  const { colors, space, radius, size, reduceTransparency } = useTheme();
  const insets = useSafeAreaInsets();
  const w = useWorkoutSession();
  const now = useNow(1000);
  const floatingSpace = useFloatingButtonSpace();

  const { session, query } = w;
  useEffect(() => {
    if (!query.loading && session === null && router.canGoBack()) router.back();
  }, [query.loading, session]);

  if (!session) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const time = formatClock(elapsedSec(session.startedAt, now));
  const bottomPanel = w.editing ? (
    <Keypad
      field={w.editing.field}
      text={w.editing.text}
      step={w.keypadStep}
      isLast={w.editingIsLast}
      onKey={w.onKey}
      onStep={w.onStep}
      onNext={() => void w.onNextField()}
      onClose={() => void w.closeEditor()}
    />
  ) : w.rest ? (
    <RestTimer
      remainingSec={w.rest.left}
      progress={w.rest.progress}
      nextText={w.rest.next}
      onAdjust={(d) => void w.onAdjustRest(d)}
      onSkip={() => void w.skipRest()}
    />
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeepAwake />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingHorizontal: space.md,
          // Zapas na panel minutnika / klawiatury i pływający przycisk.
          paddingBottom: floatingSpace + (bottomPanel ? size.button * 4 : 0),
          gap: space.section,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <HeaderIconButton
            icon={{ ios: 'chevron.down', web: 'expand_more' }}
            label={t('workout.collapse')}
            onPress={() => router.back()}
          />
          <View style={{ flex: 1 }} />
          <HeaderIconButton
            icon={{ ios: 'ellipsis', web: 'more_horiz' }}
            label={t('workout.more')}
            onPress={w.discard}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.finish')}
            onPress={() => void w.finish()}
            style={{
              minHeight: size.touchMin,
              paddingHorizontal: space.md,
              borderRadius: radius.capsule,
              justifyContent: 'center',
              backgroundColor: reduceTransparency ? colors.raised : colors.fill,
            }}
          >
            <Text variant="subheadline" style={{ fontWeight: '600' }}>
              {t('workout.finish')}
            </Text>
          </Pressable>
        </View>
        <View style={{ gap: space.xxs / 2, marginTop: -space.sm }}>
          <Text
            variant="footnote"
            color="label2"
            accessibilityLabel={t('workout.elapsedLabel', { time })}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {t('workout.elapsed', { time })}
          </Text>
          <Text variant="largeTitle" accessibilityRole="header">
            {session.name ?? t('workout.emptyName')}
          </Text>
        </View>

        {w.item ? (
          <CurrentExercise
            item={w.item}
            editing={w.editing}
            stopwatchSec={w.stopwatchSec}
            onEdit={(setId, field) => void w.openEditor(setId, field)}
            onToggle={(setId) => void w.toggleSet(setId)}
            onSetMenu={w.setMenu}
            onAddSet={() => void w.addSetToCurrent()}
            onMenu={w.exerciseMenu}
            onStopwatch={() => void w.onStopwatch()}
          />
        ) : (
          <EmptyState
            title={t('workout.noExercisesTitle')}
            body={t('workout.noExercisesBody')}
            action={{
              label: t('workout.addExercise'),
              onPress: () => router.push('/trening/dodaj'),
            }}
          />
        )}

        {w.item ? (
          <NextExercises
            exercises={session.exercises}
            current={w.index}
            onSelect={(i) => void w.selectExercise(i)}
            onAdd={() => router.push('/trening/dodaj')}
          />
        ) : null}
      </ScrollView>

      {bottomPanel ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: space.sm,
            right: space.sm,
            bottom: w.editing ? Math.max(insets.bottom, space.sm) : floatingSpace - space.sm,
          }}
        >
          {bottomPanel}
        </View>
      ) : null}

      {!w.editing && w.item ? (
        <FloatingButton label={w.primaryLabel} onPress={() => void w.onPrimary()} />
      ) : null}

      {w.record ? <RecordToast detail={w.record} onHide={w.hideRecord} /> : null}
    </View>
  );
}
