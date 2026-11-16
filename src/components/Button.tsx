import { Pressable, type PressableProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'text' | 'destructive';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  icon?: IconName;
  /** Druga linia pod etykietą (np. „82,5 kg × 8”); czytnik ekranu czyta obie. */
  detail?: string;
  /** Wysokość 56 pt (główny przycisk ekranu treningu). */
  large?: boolean;
};

/**
 * Przyciski z docs/DESIGN.md §6: główny (kapsuła 52 pt, akcent), drugorzędny (44 pt, `fill`),
 * tekstowy i usuwający (bez tła, min. 44 pt). Naciśnięcie: skala 0,97 (bez niej przy Ogranicz ruch).
 */
export function Button({
  label,
  variant = 'primary',
  icon,
  detail,
  large,
  disabled,
  ...rest
}: Props) {
  const { colors, size, space, radius, motion, reduceMotion } = useTheme();

  const height = large ? size.buttonLarge : variant === 'primary' ? size.button : size.touchMin;
  const background =
    variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.fill : undefined;
  const textColor =
    variant === 'primary'
      ? 'onAccent'
      : variant === 'secondary'
        ? 'label'
        : variant === 'destructive'
          ? 'danger'
          : 'accentText';
  const iconColor = colors[textColor];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? t('common.labelWithDetail', { label, detail }) : label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: height,
        paddingHorizontal: background ? space.xl : space.xs,
        borderRadius: radius.capsule,
        backgroundColor: background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
        opacity: disabled ? 0.4 : 1,
        transform: [{ scale: pressed && !reduceMotion ? motion.pressedScale : 1 }],
      })}
      {...rest}
    >
      {icon ? <Icon name={icon} color={iconColor} size={size.iconSmall} /> : null}
      {detail ? (
        <View style={{ alignItems: 'center' }}>
          <Text variant="headline" color={textColor}>
            {label}
          </Text>
          <Text
            variant="footnote"
            color={textColor}
            numberOfLines={1}
            style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}
          >
            {detail}
          </Text>
        </View>
      ) : (
        <Text variant="headline" color={textColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Główny przycisk pływający nad treścią, z cieniem i bez panelu pod spodem. */
export function FloatingButton(props: Props) {
  const { colors, space, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: space.screen,
        right: space.screen,
        bottom: Math.max(insets.bottom, space.md) + space.xs,
      }}
    >
      <View style={{ borderRadius: radius.capsule, boxShadow: colors.shadowFloating }}>
        <Button {...props} variant="primary" />
      </View>
    </View>
  );
}

/** Zapas pod treścią, żeby pływający przycisk nie zasłaniał ostatniego wiersza. */
export function useFloatingButtonSpace(large = false): number {
  const { size, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (large ? size.buttonLarge : size.button) + Math.max(insets.bottom, space.md) + space.xl;
}
