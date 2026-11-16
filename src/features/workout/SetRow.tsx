import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { WorkoutSet } from '@/data/models';
import type { ExerciseType } from '@/domain/types';
import {
  displayKeypadText,
  formatKeypadValue,
  type KeypadField,
  usesDuration,
  usesReps,
  usesWeight,
} from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { formatSetValues } from './session';

/** Kolumny tabeli: Seria / Poprzednio / kg / Powt. / odhaczenie (makieta design/v2/Trening). */
export const COLUMNS = { set: 36, weight: 76, reps: 60, duration: 104 } as const;
/** Ramka bieżącej serii (stała grubość, żeby wiersz nie skakał). */
export const ROW_BORDER = 1.5;

type Props = {
  set: WorkoutSet;
  type: ExerciseType;
  /** Numer serii roboczej; rozgrzewka ma „R”. */
  number: number;
  previous: WorkoutSet | undefined;
  /** Pierwsza nieodhaczona seria: wyróżniona ramką akcentu. */
  current: boolean;
  /** Seria pobiła rekord w tym treningu: plakietka zamiast „Poprzednio”. */
  record: boolean;
  /** Edytowane pole (podświetlone) i jego tekst z klawiatury. */
  editing: { field: KeypadField; text: string } | null;
  onEdit: (field: KeypadField) => void;
  onToggle: () => void;
  onMenu: () => void;
};

export function SetRow({
  set,
  type,
  number,
  previous,
  current,
  record,
  editing,
  onEdit,
  onToggle,
  onMenu,
}: Props) {
  const { colors, space, radius, size, font, motion, reduceMotion, scheme } = useTheme();
  const done = Boolean(set.completedAt);
  const warmup = set.kind === 'warmup';
  const label = warmup ? t('workout.warmupShort') : String(number);
  const setName = warmup ? t('workout.warmupLabel') : t('workout.setLabel', { n: number });

  const [scale] = useState(() => new Animated.Value(1));
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current && !reduceMotion) {
      scale.setValue(0.3);
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
    const text = displayKeypadText(active ? editing.text : formatKeypadValue(value, field), field);
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
          height: size.touchMin,
          borderRadius: radius.inner,
          borderCurve: 'continuous',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: current || active ? colors.fill : undefined,
          borderWidth: 2,
          borderColor: active ? colors.accent : 'transparent',
        }}
      >
        <Text
          variant="brandKey"
          color={done && !active ? 'label2' : 'label'}
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
        paddingVertical: space.xxs + space.xxs / 2,
        paddingHorizontal: space.xs,
        minHeight: size.touchMin + space.md,
        borderRadius: radius.row,
        borderCurve: 'continuous',
        // Ciemny motyw: wiersz jaśniejszy od karty; jasny: tło ekranu (karta jest biała).
        backgroundColor: current ? (scheme === 'dark' ? colors.raised : colors.bg) : undefined,
        borderWidth: ROW_BORDER,
        borderColor: current ? colors.accent : 'transparent',
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
          color={warmup ? 'accentText' : done ? 'label2' : 'label'}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {label}
        </Text>
      </Pressable>
      {record ? (
        <View
          accessible
          accessibilityLabel={t('workout.recordBadgeLabel')}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xxs }}
        >
          <Icon
            name={{ ios: 'trophy', web: 'emoji_events' }}
            color={colors.accentText}
            size={font.subheadline.size}
          />
          <Text variant="footnote" color="accentText" style={{ fontWeight: '600' }}>
            {t('workout.recordBadge')}
          </Text>
        </View>
      ) : (
        <Text
          variant="footnote"
          color="label2"
          numberOfLines={1}
          style={{ flex: 1, fontVariant: ['tabular-nums'] }}
        >
          {formatSetValues(type, previous)}
        </Text>
      )}
      {usesWeight(type) ? cell('weight', set.weightKg, COLUMNS.weight) : null}
      {usesReps(type) ? cell('reps', set.reps, COLUMNS.reps) : null}
      {usesDuration(type) ? cell('duration', set.durationSec, COLUMNS.duration) : null}
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
          backgroundColor: done ? colors.accentSoft : undefined,
          borderWidth: done ? 0 : 2,
          borderColor: current ? colors.accent : colors.label2,
        }}
      >
        {done ? (
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon
              name={{ ios: 'checkmark', web: 'check' }}
              color={colors.accentText}
              size={size.iconSmall}
            />
          </Animated.View>
        ) : null}
      </Pressable>
    </View>
  );
}
