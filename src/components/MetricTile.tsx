import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  /** Pusta wartość = „—” i opis dla VoiceOver. */
  value: string | null;
  unit?: string;
  emptyLabel: string;
};

/** Kafelek z liczbą: `surface`, etykieta Footnote, wartość `metric` (docs/DESIGN.md §6). */
export function MetricTile({ label, value, unit, emptyLabel }: Props) {
  const { colors, radius, space } = useTheme();
  const spoken = value ? `${label}: ${value}${unit ? ` ${unit}` : ''}` : `${label}: ${emptyLabel}`;

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        padding: space.card,
        gap: space.xxs,
      }}
    >
      <Text variant="footnote" color="label2">
        {label}
      </Text>
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xxs, flexWrap: 'wrap' }}
      >
        <Text variant="metric">{value ?? '—'}</Text>
        {value && unit ? (
          <Text variant="subheadline" color="label2">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
