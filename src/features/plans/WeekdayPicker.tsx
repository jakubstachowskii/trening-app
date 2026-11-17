import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

type Props = {
  /** Wybrane dni 0–6 (0 = poniedziałek). */
  value: readonly number[];
  onChange: (next: number[]) => void;
};

/**
 * Dni treningowe planu: 7 kółek jak w pasku dni na „Dziś” (makieta design/v2/Start).
 * Wybrany dzień wygląda jak „zrobiony” (tło `accentSoft`), niewybrany jak zwykły dzień z cienką ramką.
 */
export function WeekdayPicker({ value, onChange }: Props) {
  const { colors, size, radius } = useTheme();
  const initials = t('today.dayInitials').split(',');
  const names = t('today.weekdayNames').split(',');

  const toggle = (day: number) =>
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b),
    );

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {names.map((name, day) => {
        const on = value.includes(day);
        return (
          <Pressable
            key={name}
            accessibilityRole="checkbox"
            accessibilityLabel={name}
            accessibilityState={{ checked: on }}
            onPress={() => toggle(day)}
            style={{
              width: size.touchMin,
              height: size.touchMin,
              borderRadius: radius.capsule,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.accentSoft : undefined,
              borderWidth: on ? 0 : 1.5,
              borderColor: colors.fill,
            }}
          >
            <Text
              variant="subheadline"
              color={on ? 'accentText' : 'label2'}
              style={{ fontWeight: '600' }}
            >
              {/* Litery od poniedziałku (lista liter w tekstach zaczyna się od niedzieli). */}
              {initials[(day + 1) % 7]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
