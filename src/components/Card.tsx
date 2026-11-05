import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';

/** Karta na tle ekranu: promień card, wcięcie card (docs/DESIGN.md). */
export function Card({ style, ...rest }: ViewProps) {
  const { colors, radius, space } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          borderCurve: 'continuous',
          padding: space.card,
          gap: space.xs,
        },
        style,
      ]}
      {...rest}
    />
  );
}
