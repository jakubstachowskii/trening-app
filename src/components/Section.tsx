import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type Props = {
  title: string;
  /** Element po prawej stronie nagłówka, np. przycisk tekstowy. */
  action?: ReactNode;
  children: ReactNode;
};

/** Sekcja z nagłówkiem nad kartą (docs/DESIGN.md: nagłówki sekcji nad kartami). */
export function Section({ title, action, children }: Props) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.xs,
          paddingHorizontal: space.xxs,
        }}
      >
        <Text variant="title3" accessibilityRole="header" style={{ flexShrink: 1 }}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}
