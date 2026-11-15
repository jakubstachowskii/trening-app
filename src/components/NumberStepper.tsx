import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { formatNumber, t } from '@/i18n';
import { useTheme } from '@/theme';
import { hapticSelection } from '@/utils/haptics';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Ułamki (np. ciężar 82,5). */
  decimal?: boolean;
  /** Pozwala zostawić puste pole (np. ciężar docelowy jest opcjonalny). */
  optional?: boolean;
  unit?: string;
};

/** Parsuje „82,5” i „82.5”; pusty tekst = null. Niepoprawny = undefined. */
export function parseNumber(text: string, decimal: boolean): number | null | undefined {
  const cleaned = text.trim().replace(',', '.');
  if (!cleaned) return null;
  if (!(decimal ? /^\d+(\.\d+)?$/ : /^\d+$/).test(cleaned)) return undefined;
  return Number(cleaned);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Liczba z przyciskami −/+ (44 pt) i polem do wpisania. VoiceOver: element regulowany. */
export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimal = false,
  optional = false,
  unit,
}: Props) {
  const { colors, space, radius, size, font } = useTheme();
  const [text, setText] = useState(value == null ? '' : formatNumber(value));

  // Wartość zmieniona z zewnątrz (np. przyciskiem −/+) → nowy tekst w polu.
  const [shownValue, setShownValue] = useState(value);
  if (shownValue !== value) {
    setShownValue(value);
    setText(value == null ? '' : formatNumber(value));
  }

  const set = (next: number | null) => {
    if (next == null) {
      if (optional) onChange(null);
      return;
    }
    onChange(clamp(Math.round(next * 100) / 100, min, max));
  };
  const bump = (direction: 1 | -1) => {
    hapticSelection();
    set((value ?? (direction > 0 ? min - step : min)) + direction * step);
  };
  const commit = () => {
    const parsed = parseNumber(text, decimal);
    if (parsed === undefined || (parsed === null && !optional)) {
      setText(value == null ? '' : formatNumber(value));
      return;
    }
    set(parsed);
  };

  const spoken =
    value == null ? t('stepper.empty') : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`;
  const button = (direction: 1 | -1) => (
    <Pressable
      accessibilityElementsHidden
      importantForAccessibility="no"
      onPress={() => bump(direction)}
      style={({ pressed }) => ({
        width: size.touchMin,
        height: size.touchMin,
        borderRadius: radius.capsule,
        backgroundColor: pressed ? colors.selected : colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon
        name={direction > 0 ? { ios: 'plus', web: 'add' } : { ios: 'minus', web: 'remove' }}
        size={size.iconSmall}
      />
    </Pressable>
  );

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => bump(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ gap: space.xxs }}
    >
      <Text variant="footnote" color="label2">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        {button(-1)}
        <View
          style={{
            flex: 1,
            minHeight: size.touchMin,
            borderRadius: radius.inner,
            borderCurve: 'continuous',
            backgroundColor: colors.fill,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.xxs,
            paddingHorizontal: space.sm,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            onEndEditing={commit}
            onBlur={commit}
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            placeholder={optional ? t('stepper.placeholder') : undefined}
            placeholderTextColor={colors.label3}
            selectTextOnFocus
            style={{
              minWidth: size.touchMin,
              textAlign: 'center',
              color: colors.label,
              fontSize: font.headline.size,
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
            }}
          />
          {unit ? (
            <Text variant="subheadline" color="label2">
              {unit}
            </Text>
          ) : null}
        </View>
        {button(1)}
      </View>
    </View>
  );
}
