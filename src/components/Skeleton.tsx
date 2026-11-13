import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Szkielet ładowania: wiersze `fill`, pulsują; przy Ogranicz ruch stały (docs/DESIGN.md §6). */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  const { colors, space, radius, size, motion, reduceMotion } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(0.5, { duration: motion.duration.loop / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion, motion.duration.loop]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
      style={[{ gap: space.xs }, style]}
    >
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={{
            height: size.touchMin + space.lg,
            borderRadius: radius.card,
            borderCurve: 'continuous',
            backgroundColor: colors.fill,
          }}
        />
      ))}
    </Animated.View>
  );
}
