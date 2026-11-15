import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeaderIconButton } from '@/components/stack';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import {
  completedCount,
  formatClock,
  type KeypadField,
  usesDuration,
  usesReps,
  usesWeight,
} from '@/domain/workout';
import { exerciseIcon } from '@/features/exercises/icons';
import { t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

import { progressionHint, type SessionExercise, workingNumbers } from './session';
import { COLUMNS, SetRow } from './SetRow';

export type Editing = { setId: string; field: KeypadField; text: string } | null;

type Props = {
  item: SessionExercise;
  editing: Editing;
  /** Stoper ćwiczenia na czas: sekundy od startu albo null. */
  stopwatchSec: number | null;
  onEdit: (setId: string, field: KeypadField) => void;
  onToggle: (setId: string) => void;
  onSetMenu: (setId: string) => void;
  onAddSet: () => void;
  onMenu: () => void;
  onStopwatch: () => void;
};

export function CurrentExercise({
  item,
  editing,
  stopwatchSec,
  onEdit,
  onToggle,
  onSetMenu,
  onAddSet,
  onMenu,
  onStopwatch,
}: Props) {
  const { colors, space, radius, size } = useTheme();
  const type = item.exercise.type;
  const numbers = workingNumbers(item.sets);
  const hint = progressionHint(item);
  const previousWorking = item.previous.filter((s) => s.kind === 'working');
  const previousWarmup = item.previous.filter((s) => s.kind === 'warmup');
  let warmupIndex = 0;

  const header = (label: string, width?: number) => (
    <Text
      variant="caption2"
      color="label2"
      style={{
        width,
        flex: width ? undefined : 1,
        textAlign: width ? 'center' : 'left',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {label}
    </Text>
  );

  return (
    <Card style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View
          style={{
            width: size.button - space.xxs,
            height: size.button - space.xxs,
            borderRadius: radius.inner,
            borderCurve: 'continuous',
            backgroundColor: colors.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={exerciseIcon(type, item.exercise.equipment)} size={size.icon} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: space.xxs / 2 }}>
          <Text variant="headline" accessibilityRole="header">
            {item.name}
          </Text>
          <Text variant="footnote" color="label2">
            {t('workout.progress', {
              done: completedCount(item),
              total: tPlural('units.sets', item.sets.length),
            })}
          </Text>
        </View>
        <HeaderIconButton
          icon={{ ios: 'ellipsis', web: 'more_horiz' }}
          label={t('workout.exerciseMenu')}
          onPress={onMenu}
        />
      </View>

      {item.note ? (
        <Text variant="footnote" color="label2">
          {item.note}
        </Text>
      ) : null}

      {hint ? (
        <View
          style={{
            flexDirection: 'row',
            gap: space.xs,
            paddingVertical: space.xs,
            paddingHorizontal: space.sm,
            borderRadius: radius.inner,
            borderCurve: 'continuous',
            backgroundColor: colors.accentSoft,
          }}
        >
          <Icon
            name={{ ios: 'arrow.up', web: 'arrow_upward' }}
            color={colors.accentText}
            size={16}
          />
          <Text variant="footnote" color="accentText" style={{ flex: 1, fontWeight: '600' }}>
            {hint}
          </Text>
        </View>
      ) : null}

      {usesDuration(type) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            stopwatchSec == null
              ? t('workout.stopwatch.startLabel')
              : t('workout.stopwatch.stopLabel')
          }
          onPress={onStopwatch}
          style={{
            minHeight: size.button,
            borderRadius: radius.capsule,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.xs,
            backgroundColor: stopwatchSec == null ? colors.fill : colors.accent,
          }}
        >
          <Text variant="headline" color={stopwatchSec == null ? 'label' : 'onAccent'}>
            {stopwatchSec == null ? t('workout.stopwatch.start') : t('workout.stopwatch.stop')}
          </Text>
          {stopwatchSec != null ? (
            <Text variant="headline" color="onAccent" style={{ fontVariant: ['tabular-nums'] }}>
              {formatClock(stopwatchSec)}
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      <View>
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{
            flexDirection: 'row',
            gap: space.xs,
            paddingHorizontal: space.xs,
            paddingBottom: space.xxs,
          }}
        >
          {header(t('workout.colSet'), COLUMNS.set)}
          {header(t('workout.colPrevious'))}
          {usesWeight(type) ? header(t('workout.colKg'), COLUMNS.value) : null}
          {usesReps(type) ? header(t('workout.colReps'), COLUMNS.reps) : null}
          {usesDuration(type) ? header(t('workout.colTime'), COLUMNS.value) : null}
          <View style={{ width: size.check }} />
        </View>
        <View style={{ gap: space.xxs }}>
          {item.sets.map((set, index) => {
            const previous =
              set.kind === 'warmup'
                ? previousWarmup[warmupIndex++]
                : previousWorking[numbers[index] - 1];
            return (
              <SetRow
                key={set.id}
                set={set}
                type={type}
                number={numbers[index]}
                previous={previous}
                editing={editing?.setId === set.id ? editing : null}
                onEdit={(field) => onEdit(set.id, field)}
                onToggle={() => onToggle(set.id)}
                onMenu={() => onSetMenu(set.id)}
              />
            );
          })}
        </View>
      </View>
      <Button
        variant="secondary"
        label={t('workout.addSet')}
        icon={{ ios: 'plus', web: 'add' }}
        onPress={onAddSet}
      />
    </Card>
  );
}
