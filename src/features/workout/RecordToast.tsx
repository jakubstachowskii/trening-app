import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Czas widoczności komunikatu rekordu. */
export const RECORD_TOAST_MS = 3200;

type Props = { detail: string; onHide: () => void };

/** Komunikat „Nowy rekord” u góry ekranu (ok. 3 s), ogłaszany też przez VoiceOver. */
export function RecordToast({ detail, onHide }: Props) {
  const { colors, space, radius, size, motion, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const [enter] = useState(() => new Animated.Value(0));

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${t('workout.record.title')}. ${detail}`);
    const animation = reduceMotion
      ? Animated.timing(enter, {
          toValue: 1,
          duration: motion.duration.fast,
          useNativeDriver: true,
        })
      : Animated.spring(enter, {
          toValue: 1,
          damping: motion.spring.bouncy.damping,
          stiffness: motion.spring.bouncy.stiffness,
          mass: motion.spring.bouncy.mass,
          useNativeDriver: true,
        });
    animation.start();
    const timer = setTimeout(onHide, RECORD_TOAST_MS);
    return () => clearTimeout(timer);
  }, [detail, enter, onHide, reduceMotion, motion]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [-space.lg, 0] });

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: space.sm,
        right: space.sm,
        top: insets.top + space.xs,
        opacity: enter,
        transform: reduceMotion ? [] : [{ translateY }],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          minHeight: size.button + space.xl,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          borderRadius: radius.card,
          borderCurve: 'continuous',
          backgroundColor: colors.accent,
          boxShadow: colors.shadowFloating,
        }}
      >
        <Icon
          name={{ ios: 'trophy', web: 'emoji_events' }}
          color={colors.onAccent}
          size={size.iconSmall}
        />
        <View style={{ flex: 1 }}>
          <Text variant="headline" color="onAccent">
            {t('workout.record.title')}
          </Text>
          <Text variant="footnote" color="onAccent">
            {detail}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
