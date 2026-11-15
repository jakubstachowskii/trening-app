import type { ReactNode } from 'react';
import { type AccessibilityActionEvent, Pressable, type PressableProps, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  subtitle?: string;
  /** Miniatura 40 pt z ikoną (do czasu ilustracji w F10). */
  icon?: IconName;
  /** Coś po prawej zamiast strzałki (np. uchwyt przeciągania, znacznik). */
  accessory?: ReactNode;
  showChevron?: boolean;
  /** Akcje VoiceOver, np. „Przesuń wyżej”. */
  actions?: { name: string; label: string; onAction: () => void }[];
  selected?: boolean;
};

/** Wiersz listy: min. 64 pt, miniatura 40 pt, strzałka (docs/DESIGN.md §6). */
export function ListRow({
  title,
  subtitle,
  icon,
  accessory,
  showChevron = true,
  actions,
  selected,
  onPress,
  ...rest
}: Props) {
  const { colors, space, radius, size } = useTheme();
  const thumb = size.touchMin - space.xxs;

  const onAccessibilityAction = actions
    ? (event: AccessibilityActionEvent) => {
        actions.find((a) => a.name === event.nativeEvent.actionName)?.onAction();
      }
    : undefined;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={selected === undefined ? undefined : { selected }}
      accessibilityActions={actions?.map(({ name, label }) => ({ name, label }))}
      onAccessibilityAction={onAccessibilityAction}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: size.touchMin + space.lg,
        paddingHorizontal: space.card,
        paddingVertical: space.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: pressed && onPress ? colors.fill : colors.surface,
      })}
      {...rest}
    >
      {icon ? (
        <View
          style={{
            width: thumb,
            height: thumb,
            borderRadius: radius.inner,
            borderCurve: 'continuous',
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} color={colors.accentText} size={size.iconSmall} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: space.xxs }}>
        <Text variant="body">{title}</Text>
        {subtitle ? (
          <Text variant="subheadline" color="label2">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {accessory}
      {showChevron && onPress ? (
        <Icon
          name={{ ios: 'chevron.right', web: 'chevron_right' }}
          color={colors.label3}
          size={size.iconSmall}
        />
      ) : null}
    </Pressable>
  );
}

/** Grupa wierszy na karcie z liniami między nimi (styl list iOS). */
export function ListGroup({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <View
      style={{
        borderRadius: radius.card,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      {items.map((child, index) => (
        <View
          key={index}
          style={index > 0 ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
