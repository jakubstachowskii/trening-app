import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { WorkoutSet } from '@/data/models';
import type { ExerciseType } from '@/domain/types';
import {
  formatKeypadValue,
  type KeypadField,
  usesDuration,
  usesReps,
  usesWeight,
} from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { formatSetValues } from './session';

/** Kolumny tabeli: Seria / Poprzednio / kg / Powt. / odhaczenie (makieta F2-Trening). */
export const COLUMNS = { set: 40, value: 60, reps: 52 } as const;

type Props = {
  set: WorkoutSet;
  type: ExerciseType;
  /** Numer serii roboczej; rozgrzewka ma „R”. */
  number: number;
  previous: WorkoutSet | undefined;
  /** Edytowane pole (podświetlone) i jego tekst z klawiatury. */
  editing: { field: KeypadField; text: string } | null;
  onEdit: (field: KeypadField) => void;
  onToggle: () => void;
  onMenu: () => void;
};

export function SetRow({ set, type, number, previous, editing, onEdit, onToggle, onMenu }: Props) {
  const { colors, space, radius, size, font, motion, reduceMotion } = useTheme();
  const done = Boolean(set.completedAt);
  const warmup = set.kind === 'warmup';
  const label = warmup ? t('workout.warmupShort') : String(number);
  const setName = warmup ? t('workout.warmupLabel') : t('workout.setLabel', { n: number });

  const [scale] = useState(() => new Animated.Value(1));
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current && !reduceMotion) {
      scale.setValue(0.6);
      Animated.spring(scale, {
        toValue: 1,
        damping: motion.spring.bouncy.damping,
        stiffness: motion.spring.bouncy.stiffness,
        mass: motion.spring.bouncy.mass,
        useNativeDriver: true,
      }).start();
    }
    wasDone.current = done;
  }, [done, reduceMotion, scale, motion.spring.bouncy]);

  const cell = (field: KeypadField, value: number | null, width: number) => {
    const active = editing?.field === field;
    const text = active ? editing.text : formatKeypadValue(value, field);
    const key =
      field === 'weight'
        ? 'workout.editWeight'
        : field === 'reps'
          ? 'workout.editReps'
          : 'workout.editDuration';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(key, { n: label, value: text || t('workout.emptyValue') })}
        accessibilityState={{ selected: active }}
        onPress={() => onEdit(field)}
        style={{
          width,
          minHeight: size.touchMin,
          borderRadius: radius.small,
          borderCurve: 'continuous',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.fill,
          borderWidth: 2,
          borderColor: active ? colors.accent : colors.fill,
        }}
      >
        <Text
          variant="callout"
          style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {text || '—'}
        </Text>
      </Pressable>
    );
  };

  const values = formatSetValues(type, set);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        paddingVertical: space.xxs,
        paddingHorizontal: space.xs,
        minHeight: size.touchMin + space.xs,
        borderRadius: radius.inner,
        borderCurve: 'continuous',
        backgroundColor: done ? colors.accentSoft : undefined,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('workout.setMenu', { n: label })}
        accessibilityHint={setName}
        onPress={onMenu}
        style={{ width: COLUMNS.set, minHeight: size.touchMin, justifyContent: 'center' }}
      >
        <Text
          variant="headline"
          color={warmup ? 'accentText' : 'label'}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {label}
        </Text>
      </Pressable>
      <Text
        variant="footnote"
        color="label2"
        numberOfLines={1}
        style={{ flex: 1, fontVariant: ['tabular-nums'] }}
      >
        {formatSetValues(type, previous)}
      </Text>
      {usesWeight(type) ? cell('weight', set.weightKg, COLUMNS.value) : null}
      {usesReps(type) ? cell('reps', set.reps, COLUMNS.reps) : null}
      {usesDuration(type) ? cell('duration', set.durationSec, COLUMNS.value) : null}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={t('workout.setA11y', {
          label: setName,
          values,
          state: done ? t('workout.setDone') : t('workout.setPending'),
        })}
        accessibilityHint={done ? t('workout.uncheckHint') : t('workout.checkHint')}
        onPress={onToggle}
        style={{
          width: size.check,
          height: size.check,
          borderRadius: size.check / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.accent : undefined,
          borderWidth: done ? 0 : 2,
          borderColor: colors.label2,
        }}
      >
        {done ? (
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon
              name={{ ios: 'checkmark', web: 'check' }}
              color={colors.onAccent}
              size={font.headline.size}
            />
          </Animated.View>
        ) : null}
      </Pressable>
    </View>
  );
}
