import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';
import { hapticSelection } from '@/utils/haptics';

import { Text } from './Text';

type Props<K extends string> = {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
};

/** Tło `fill`, wybrany segment `selected` z lekkim cieniem, segment min. 44 pt. */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<K>) {
  const { colors, space, radius, size } = useTheme();
  const inset = space.xxs / 2;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        padding: inset,
        borderRadius: radius.inner,
        borderCurve: 'continuous',
        backgroundColor: colors.fill,
      }}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              hapticSelection();
              onChange(option.key);
            }}
            style={{
              flex: 1,
              minHeight: size.touchMin - inset * 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.inner - inset,
              borderCurve: 'continuous',
              backgroundColor: selected ? colors.selected : undefined,
              boxShadow: selected ? colors.shadowFloating : undefined,
            }}
          >
            <Text variant="subheadline" style={{ fontWeight: selected ? '600' : '400' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
