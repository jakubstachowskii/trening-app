import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type Props = {
  title: string;
  children?: ReactNode;
};

/** Ekran karty: duży tytuł i przewijana treść. Wcięcia pod pasek stanu i kart ustawia iOS. */
export function Screen({ title, children }: Props) {
  const { colors, space } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: space.xs,
        paddingBottom: space.section,
        gap: space.section,
      }}
    >
      <Text variant="largeTitle" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </ScrollView>
  );
}
