import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type ReactNode, useMemo } from 'react';
import { Platform, Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Tło kontrolki w szkle: Liquid Glass na iOS 26+, inaczej półprzezroczyste `glassControl` z krawędzią. */
function GlassSurface({ style, children }: { style: ViewStyle; children: ReactNode }) {
  const { colors, reduceTransparency, scheme } = useTheme();
  const glass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable(), []);
  if (glass && !reduceTransparency) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme={scheme} style={style}>
        {children}
      </GlassView>
    );
  }
  return (
    <View
      style={[
        style,
        {
          backgroundColor: reduceTransparency ? colors.raised : colors.glassControl,
          borderWidth: 1,
          borderColor: reduceTransparency ? colors.separator : colors.glassEdge,
        },
      ]}
    >
      {children}
    </View>
  );
}

type Common = { label: string; onPress: () => void };

/** Okrągły przycisk 44 pt w szkle (nagłówek ekranu treningu: Zwiń, więcej opcji). */
export function GlassIconButton({ icon, label, onPress }: Common & { icon: IconName }) {
  const { size, motion, reduceMotion } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !reduceMotion ? motion.pressedScale : 1 }],
      })}
    >
      <GlassSurface
        style={{
          width: size.touchMin,
          height: size.touchMin,
          borderRadius: size.touchMin / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={size.iconSmall} />
      </GlassSurface>
    </Pressable>
  );
}

/** Kapsuła z tekstem w szkle (np. „Zakończ”). */
export function GlassPillButton({ label, onPress }: Common) {
  const { size, space, radius, motion, reduceMotion } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !reduceMotion ? motion.pressedScale : 1 }],
      })}
    >
      <GlassSurface
        style={{
          minHeight: size.touchMin,
          paddingHorizontal: space.md + space.xxs / 2,
          borderRadius: radius.capsule,
          justifyContent: 'center',
        }}
      >
        <Text variant="subheadline" style={{ fontWeight: '600' }}>
          {label}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}
