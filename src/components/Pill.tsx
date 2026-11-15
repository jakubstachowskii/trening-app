import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Krzyżyk: stuknięcie usuwa (np. aktywny filtr). */
  removable?: boolean;
  accessibilityLabel?: string;
};

/** Pigułka 32 pt, `fill`; wyróżniona: `accentSoft` / `accentText`. Cel dotyku dociągnięty do 44 pt. */
export function Pill({ label, selected, onPress, removable, accessibilityLabel }: Props) {
  const { colors, space, radius, size } = useTheme();
  const height = size.touchMin - space.sm;
  const slop = (size.touchMin - height) / 2;

  const body = (
    <View
      style={{
        minHeight: height,
        paddingHorizontal: space.sm,
        borderRadius: radius.capsule,
        backgroundColor: selected ? colors.accentSoft : colors.fill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xxs,
      }}
    >
      <Text variant="subheadline" color={selected ? 'accentText' : 'label'}>
        {label}
      </Text>
      {removable ? (
        <Icon
          name={{ ios: 'xmark', web: 'close' }}
          color={selected ? colors.accentText : colors.label2}
          size={size.iconSmall - space.xxs}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel ?? label}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: slop, bottom: slop }}
      accessibilityRole={removable ? 'button' : 'togglebutton'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={removable ? undefined : { checked: Boolean(selected) }}
    >
      {body}
    </Pressable>
  );
}
