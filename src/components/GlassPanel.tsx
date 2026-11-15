import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useMemo } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';

/**
 * Pływający panel w warstwie kontrolek (minutnik, klawiatura): Liquid Glass na iOS 26+,
 * a przy Zmniejsz przezroczystość albo bez szkła pełne tło `raised` z krawędzią (docs/DESIGN.md §5).
 */
export function GlassPanel({ style, children, ...rest }: ViewProps) {
  const { colors, radius, space, reduceTransparency, scheme } = useTheme();
  const glass = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable(), []);

  const base = {
    borderRadius: radius.card,
    borderCurve: 'continuous' as const,
    padding: space.md,
    boxShadow: colors.shadowFloating,
  };

  if (glass && !reduceTransparency) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme={scheme} style={[base, style]} {...rest}>
        {children}
      </GlassView>
    );
  }
  return (
    <View
      style={[
        base,
        { backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.separator },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
