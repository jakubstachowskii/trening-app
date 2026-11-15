import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/theme';

export type IconName = Parameters<typeof SymbolView>[0]['name'];

type Props = {
  name: IconName;
  color?: ColorValue;
  size?: number;
};

/** Ikona: SF Symbols na iOS, Material na web. Zawsze dekoracja — etykietę ma element nadrzędny. */
export function Icon({ name, color, size }: Props) {
  const { colors, size: sizes } = useTheme();
  return (
    <SymbolView
      name={name}
      tintColor={color ?? colors.label}
      size={size ?? sizes.icon}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
