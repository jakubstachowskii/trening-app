import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { GlassPanel } from '@/components/GlassPanel';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import type { KeypadField, KeypadKey } from '@/domain/workout';
import { formatNumber, t } from '@/i18n';
import { useTheme } from '@/theme';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

const FIELD_LABEL: Record<
  KeypadField,
  'workout.keypad.weight' | 'workout.keypad.reps' | 'workout.keypad.duration'
> = {
  weight: 'workout.keypad.weight',
  reps: 'workout.keypad.reps',
  duration: 'workout.keypad.duration',
};

type Props = {
  field: KeypadField;
  text: string;
  /** Krok −/+ (2,5 kg, 1 powt., 5 s). */
  step: number;
  /** Ostatnie pole serii: „Dalej” odhacza serię. */
  isLast: boolean;
  onKey: (key: KeypadKey) => void;
  onStep: (direction: 1 | -1) => void;
  onNext: () => void;
  onClose: () => void;
};

/** Duża klawiatura w dolnym szklanym panelu, zamiast systemowej (szybkie wpisywanie między seriami). */
export function Keypad({ field, text, step, isLast, onKey, onStep, onNext, onClose }: Props) {
  const { colors, space, radius, size } = useTheme();
  const label = t(FIELD_LABEL[field]);
  const stepText = formatNumber(step);
  const keyStyle = ({ pressed }: { pressed: boolean }) => ({
    flex: 1,
    minHeight: size.button,
    borderRadius: radius.inner,
    borderCurve: 'continuous' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: pressed ? colors.selected : colors.fill,
  });

  return (
    <GlassPanel style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.keypad.minus', { step: stepText })}
          onPress={() => onStep(-1)}
          style={keyStyle}
        >
          <Text variant="title3">−</Text>
        </Pressable>
        <View
          accessible
          accessibilityLabel={t('workout.keypad.value', {
            field: label,
            value: text || t('workout.emptyValue'),
          })}
          accessibilityLiveRegion="polite"
          style={{ flex: 2, alignItems: 'center' }}
        >
          <Text variant="footnote" color="label2">
            {label}
          </Text>
          <Text variant="title1" style={{ fontVariant: ['tabular-nums'] }}>
            {text || '—'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.keypad.plus', { step: stepText })}
          onPress={() => onStep(1)}
          style={keyStyle}
        >
          <Text variant="title3">+</Text>
        </Pressable>
      </View>

      {ROWS.map((row) => (
        <View key={row.join('')} style={{ flexDirection: 'row', gap: space.xs }}>
          {row.map((key) => {
            const disabled = key === ',' && field !== 'weight';
            const a11y =
              key === 'back'
                ? t('workout.keypad.backspace')
                : key === ','
                  ? t('workout.keypad.decimal')
                  : key;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={a11y}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => onKey(key)}
                style={(state) => [keyStyle(state), { opacity: disabled ? 0.4 : 1 }]}
              >
                {key === 'back' ? (
                  <Icon name={{ ios: 'delete.left', web: 'backspace' }} size={size.icon} />
                ) : (
                  <Text variant="title2">{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: space.xs, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.keypad.close')}
          onPress={onClose}
          hitSlop={space.xxs}
          style={{
            minWidth: size.touchMin,
            minHeight: size.touchMin,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={{ ios: 'keyboard.chevron.compact.down', web: 'keyboard_hide' }}
            color={colors.label2}
            size={size.icon}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            label={isLast ? t('workout.keypad.complete') : t('workout.keypad.next')}
            onPress={onNext}
          />
        </View>
      </View>
    </GlassPanel>
  );
}
