import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeaderIconButton } from '@/components/stack';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import {
  type KeypadField,
  nextPendingSetIndex,
  usesDuration,
  usesReps,
  usesWeight,
} from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { progressionHint, type SessionExercise, workingNumbers } from './session';
import { COLUMNS, ROW_BORDER, SetRow } from './SetRow';

export type Editing = { setId: string; field: KeypadField; text: string } | null;

type Props = {
  item: SessionExercise;
  /** Pozycja ćwiczenia w treningu (od 1) i liczba ćwiczeń. */
  position: number;
  total: number;
  editing: Editing;
  /** Serie, które pobiły rekord w tym treningu. */
  recordSetIds: readonly string[];
  /** Stoper ćwiczenia na czas (sekundy) — rośnie w bieżącym wierszu. */
  stopwatchSec: number | null;
  onEdit: (setId: string, field: KeypadField) => void;
  onToggle: (setId: string) => void;
  onSetMenu: (setId: string) => void;
  onAddSet: () => void;
  onMenu: () => void;
};

/** Karta bieżącego ćwiczenia (makieta design/v2/Trening): nagłówek, podpowiedź i tabela serii. */
export function CurrentExercise({
  item,
  position,
  total,
  editing,
  recordSetIds,
  stopwatchSec,
  onEdit,
  onToggle,
  onSetMenu,
  onAddSet,
  onMenu,
}: Props) {
  const { colors, space, size, font } = useTheme();
  const type = item.exercise.type;
  const numbers = workingNumbers(item.sets);
  const hint = progressionHint(item);
  const pendingIndex = nextPendingSetIndex(item);
  const finished = item.sets.length > 0 && pendingIndex === -1;
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
    <Card style={{ paddingHorizontal: space.sm, paddingBottom: space.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space.xs,
          paddingHorizontal: space.xs,
          paddingBottom: space.sm,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: space.xxs }}>
          <Text variant="footnote" color={finished ? 'accentText' : 'label2'}>
            {t(finished ? 'workout.exerciseOfDone' : 'workout.exerciseOf', {
              n: position,
              total,
            })}
          </Text>
          <Text variant="brandM" accessibilityRole="header">
            {item.name}
          </Text>
          {hint ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.xxs + space.xxs / 2 }}
            >
              <Icon
                name={{ ios: 'arrow.up', web: 'arrow_upward' }}
                color={colors.accentText}
                size={font.footnote.size}
              />
              <Text
                variant="footnote"
                color="accentText"
                style={{ flex: 1, fontWeight: '600', fontVariant: ['tabular-nums'] }}
              >
                {hint}
              </Text>
            </View>
          ) : null}
          {item.note ? (
            <Text variant="footnote" color="label2">
              {item.note}
            </Text>
          ) : null}
        </View>
        <View style={{ marginTop: -space.xs, marginRight: -space.xs }}>
          <HeaderIconButton
            icon={{ ios: 'ellipsis', web: 'more_horiz' }}
            label={t('workout.exerciseMenu')}
            onPress={onMenu}
          />
        </View>
      </View>

      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          flexDirection: 'row',
          gap: space.xs,
          paddingHorizontal: space.xs + ROW_BORDER,
          paddingBottom: space.xxs + space.xxs / 2,
        }}
      >
        {header(t('workout.colSet'), COLUMNS.set)}
        {header(t('workout.colPrevious'))}
        {usesWeight(type) ? header(t('workout.colKg'), COLUMNS.weight) : null}
        {usesReps(type) ? header(t('workout.colReps'), COLUMNS.reps) : null}
        {usesDuration(type) ? header(t('workout.colTime'), COLUMNS.duration) : null}
        <View style={{ width: size.check }} />
      </View>
      <View style={{ gap: space.xxs / 2 }}>
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
              current={index === pendingIndex}
              liveSec={index === pendingIndex ? stopwatchSec : null}
              record={recordSetIds.includes(set.id)}
              editing={editing?.setId === set.id ? editing : null}
              onEdit={(field) => onEdit(set.id, field)}
              onToggle={() => onToggle(set.id)}
              onMenu={() => onSetMenu(set.id)}
            />
          );
        })}
      </View>
      <View style={{ marginTop: space.xxs }}>
        <Button variant="text" label={t('workout.addSet')} onPress={onAddSet} />
      </View>
    </Card>
  );
}
