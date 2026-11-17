import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, type ScrollViewInstance, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomFade } from '@/components/BottomFade';
import { FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GlassIconButton, GlassPillButton } from '@/components/GlassControl';
import { GlassMenuButton } from '@/components/MenuButtons';
import { Text } from '@/components/Text';
import { elapsedSec, formatClock, nextPendingSetIndex } from '@/domain/workout';
import { t } from '@/i18n';
import { CurrentExercise } from '@/features/workout/CurrentExercise';
import { KeepAwake } from '@/features/workout/KeepAwake';
import { Keypad } from '@/features/workout/Keypad';
import { NextExercises } from '@/features/workout/NextExercises';
import { RestBar, RestSheet } from '@/features/workout/RestTimer';
import { type SessionExercise } from '@/features/workout/session';
import { useNow } from '@/features/workout/useNow';
import { useWorkoutSession } from '@/features/workout/useWorkoutSession';
import { useTheme } from '@/theme';

/** Pasek segmentów = ćwiczenia treningu; zrobione i bieżące w kolorze akcentu. */
function ExerciseSegments({
  exercises,
  current,
}: {
  exercises: SessionExercise[];
  current: number;
}) {
  const { colors, space, size } = useTheme();
  if (exercises.length < 2) return null;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('workout.segmentsLabel', { n: current + 1, total: exercises.length })}
      style={{ flexDirection: 'row', gap: space.xxs }}
    >
      {exercises.map((e, i) => {
        const on = i === current || (e.sets.length > 0 && nextPendingSetIndex(e) === -1);
        return (
          <View
            key={e.id}
            style={{
              flex: 1,
              height: size.segment,
              borderRadius: size.segment / 2,
              backgroundColor: on ? colors.accent : colors.fill,
            }}
          />
        );
      })}
    </View>
  );
}

/** Trening w toku (makieta design/v2/Trening). Zapis na bieżąco, więc „Zwiń” niczego nie traci. */
export default function WorkoutScreen() {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const w = useWorkoutSession();
  const now = useNow(1000);
  const floatingSpace = useFloatingButtonSpace(true);

  const { session, query, keepAwake } = w;
  const scroll = useRef<ScrollViewInstance>(null);
  const cardY = useRef(0);
  const editingSetId = w.editing?.setId;
  // Klawiatura zasłania dół ekranu: karta ćwiczenia jedzie do góry, żeby wiersz był widoczny.
  useEffect(() => {
    // Odejmujemy wcięcie pod paskiem stanu, żeby nazwa ćwiczenia nie chowała się pod Dynamic Island.
    if (editingSetId)
      scroll.current?.scrollTo({ y: Math.max(0, cardY.current - insets.top - space.xs) });
  }, [editingSetId, insets.top, space.xs]);
  // Nowe ćwiczenie zaczyna się od góry ekranu (nazwa i tabela widoczne, nie przewinięte z poprzedniego).
  const exerciseIndex = w.index;
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [exerciseIndex]);
  useEffect(() => {
    if (!query.loading && session === null && router.canGoBack()) router.back();
  }, [query.loading, session]);

  if (!session) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const time = formatClock(elapsedSec(session.startedAt, now));
  const rest = w.rest;
  const panelBottom = Math.max(insets.bottom, space.md) + space.xs;

  // Dół ekranu: klawiatura albo przerwa (pasek / arkusz) albo główny przycisk — nigdy dwa naraz.
  const bottom = w.editing ? (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: space.sm,
        right: space.sm,
        bottom: Math.max(insets.bottom, space.sm),
      }}
    >
      <Keypad
        field={w.editing.field}
        text={w.editing.text}
        step={w.keypadStep}
        setNumber={w.keypadSetNumber}
        nextLabel={w.keypadNext}
        onKey={w.onKey}
        onStep={w.onStep}
        onNext={() => void w.onNextField()}
        onClose={() => void w.closeEditor()}
      />
    </View>
  ) : rest?.expanded ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <RestSheet
        remainingSec={rest.left}
        progress={rest.progress}
        totalSec={rest.total}
        nextText={rest.next}
        onAdjust={(d) => void w.onAdjustRest(d)}
        onSkip={() => void w.skipRest()}
        onCollapse={w.collapseRest}
      />
    </View>
  ) : rest ? (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: space.sm, right: space.sm, bottom: panelBottom }}
    >
      <RestBar
        remainingSec={rest.left}
        progress={rest.progress}
        label={rest.label}
        highlight={rest.highlight}
        onAdjust={(d) => void w.onAdjustRest(d)}
        onSkip={() => void w.skipRest()}
        onExpand={w.expandRest}
      />
    </View>
  ) : w.item ? (
    <FloatingButton
      label={w.primary.label}
      detail={w.primary.detail}
      large
      onPress={() => void w.onPrimary()}
    />
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {keepAwake ? <KeepAwake /> : null}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingHorizontal: space.md,
          // Zapas na klawiaturę (wysoka) albo pasek przerwy / przycisk.
          paddingBottom: floatingSpace + (w.editing ? floatingSpace * 3 : 0),
          gap: space.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <GlassIconButton
              icon={{ ios: 'chevron.down', web: 'expand_more' }}
              label={t('workout.collapse')}
              onPress={() => router.back()}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
                {session.name ?? t('workout.emptyName')}
              </Text>
              <Text
                variant="footnote"
                color="label2"
                accessibilityLabel={t('workout.elapsedLabel', { time })}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {time}
              </Text>
            </View>
            <GlassMenuButton
              label={t('workout.more')}
              items={[{ label: t('workout.discard'), destructive: true, onPress: w.discard }]}
            />
            <GlassPillButton label={t('workout.finish')} onPress={() => void w.finish()} />
          </View>
          <ExerciseSegments exercises={session.exercises} current={w.index} />
        </View>

        {w.item ? (
          <View onLayout={(e) => (cardY.current = e.nativeEvent.layout.y)}>
            <CurrentExercise
              item={w.item}
              position={w.index + 1}
              total={session.exercises.length}
              editing={w.editing}
              recordSetIds={w.recordSetIds}
              stopwatchSec={w.stopwatchSec}
              onEdit={(setId, field) => void w.openEditor(setId, field)}
              onToggle={(setId) => void w.toggleSet(setId)}
              setMenuItems={w.setMenuItems}
              onAddSet={() => void w.addSetToCurrent()}
              menuItems={w.exerciseMenuItems}
            />
          </View>
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

      {w.editing ? null : <BottomFade height={floatingSpace + space.xl} />}
      {bottom}
    </View>
  );
}
