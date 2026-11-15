import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type Props = {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
};

/** Pusty stan: tytuł, jedno zdanie, jedno działanie (docs/DESIGN.md §6). */
export function EmptyState({ title, body, action, secondaryAction }: Props) {
  const { space } = useTheme();
  return (
    <Card style={{ gap: space.sm, alignItems: 'flex-start' }}>
      <View accessible style={{ gap: space.xxs }}>
        <Text variant="headline">{title}</Text>
        <Text variant="subheadline" color="label2">
          {body}
        </Text>
      </View>
      {action || secondaryAction ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {action ? (
            <Button variant="secondary" label={action.label} onPress={action.onPress} />
          ) : null}
          {secondaryAction ? (
            <Button
              variant="text"
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
