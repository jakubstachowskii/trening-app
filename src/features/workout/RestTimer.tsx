import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { GlassPanel } from '@/components/GlassPanel';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatClock, REST_ADJUST_SEC } from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Wjazd od dołu ze sprężyną; przy Ogranicz ruch samo zanikanie (tokens.motion.reduceMotion). */
function useSlideUp() {
  const { motion, reduceMotion } = useTheme();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = reduceMotion
      ? Animated.timing(value, {
          toValue: 1,
          duration: motion.duration.fast,
          useNativeDriver: true,
        })
      : Animated.spring(value, {
          toValue: 1,
          damping: motion.spring.gentle.damping,
          stiffness: motion.spring.gentle.stiffness,
          mass: motion.spring.gentle.mass,
          useNativeDriver: true,
        });
    animation.start();
    return () => animation.stop();
  }, [value, reduceMotion, motion]);
  return reduceMotion
    ? { opacity: value }
    : {
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) },
        ],
      };
}

type Common = {
  remainingSec: number;
  /** 1 = cała przerwa przed nami, 0 = koniec. */
  progress: number;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
};

/**
 * Przerwa jako szklany pasek w miejscu głównego przycisku (makieta design/v2/Trening):
 * etykieta i czas (stuknięcie powiększa minutnik), −15, +15, Pomiń i cienki pasek postępu.
 */
export function RestBar({
  remainingSec,
  progress,
  label,
  highlight,
  onAdjust,
  onSkip,
  onExpand,
}: Common & {
  label: string;
  /** Etykieta w kolorze akcentu (np. „Nowy rekord”). */
  highlight: boolean;
  onExpand: () => void;
}) {
  const { colors, space, radius, size } = useTheme();
  const slide = useSlideUp();
  const time = formatClock(remainingSec);
  const round = (main: boolean) => ({
    minWidth: size.touchMin,
    height: size.touchMin,
    paddingHorizontal: main ? space.md : 0,
    borderRadius: radius.capsule,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: main ? colors.accent : colors.fill,
  });

  return (
    <Animated.View style={slide}>
      <GlassPanel
        style={{
          borderRadius: radius.sheet,
          paddingVertical: space.sm,
          paddingLeft: space.lg,
          paddingRight: space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.xs,
          overflow: 'hidden',
        }}
      >
        {/* Minutnik i przycisk naraz: VoiceOver czyta czas, a stuknięcie powiększa minutnik. */}
        <Pressable
          accessibilityRole="timer"
          accessibilityLabel={`${label}. ${t('workout.rest.remaining', { time })}`}
          accessibilityHint={t('workout.rest.expand')}
          onPress={onExpand}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Text
            variant="footnote"
            color={highlight ? 'accentText' : 'label2'}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
            style={highlight ? { fontWeight: '600' } : undefined}
          >
            {label}
          </Text>
          <Text variant="brandMetric">{time}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.minusLabel')}
          onPress={() => onAdjust(-REST_ADJUST_SEC)}
          style={round(false)}
        >
          <Text variant="subheadline" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {t('workout.rest.minusShort')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.plusLabel')}
          onPress={() => onAdjust(REST_ADJUST_SEC)}
          style={round(false)}
        >
          <Text variant="subheadline" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {t('workout.rest.plusShort')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.skipLabel')}
          onPress={onSkip}
          style={round(true)}
        >
          <Text variant="subheadline" color="onAccent" style={{ fontWeight: '600' }}>
            {t('workout.rest.skip')}
          </Text>
        </Pressable>
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: size.progressBar,
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            backgroundColor: colors.accent,
          }}
        />
      </GlassPanel>
    </Animated.View>
  );
}

const RING_STROKE = 12;

/** Powiększony minutnik: dolny arkusz z dużym pierścieniem. „Zmniejsz” nie pomija przerwy. */
export function RestSheet({
  remainingSec,
  progress,
  totalSec,
  nextText,
  onAdjust,
  onSkip,
  onCollapse,
}: Common & { totalSec: number; nextText: string | null; onCollapse: () => void }) {
  const { colors, space, radius, size } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useSlideUp();
  const time = formatClock(remainingSec);
  const ring = size.restRing;
  const r = (ring - RING_STROKE) / 2 - space.xxs;
  const circumference = 2 * Math.PI * r;
  const adjust = {
    width: size.restRing / 2 - space.sm,
    minHeight: size.touchMin,
    borderRadius: radius.capsule,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.fill,
  };

  return (
    <Animated.View style={slide}>
      <GlassPanel
        style={{
          borderRadius: 0,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: space.xs,
          paddingHorizontal: space.lg,
          paddingBottom: Math.max(insets.bottom, space.md) + space.md,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignSelf: 'stretch',
          }}
        >
          <Text variant="headline" accessibilityRole="header" style={{ paddingLeft: space.xxs }}>
            {t('workout.rest.title')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.rest.collapse')}
            onPress={onCollapse}
            style={{
              width: size.touchMin,
              height: size.touchMin,
              borderRadius: size.touchMin / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.fill,
            }}
          >
            <Icon name={{ ios: 'chevron.down', web: 'expand_more' }} size={size.iconSmall} />
          </Pressable>
        </View>

        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={t('workout.rest.remaining', { time })}
          style={{ width: ring, height: ring, marginTop: space.xxs }}
        >
          <Svg width={ring} height={ring} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              stroke={colors.fill}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              stroke={colors.accent}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))}
            />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="timerLarge">{time}</Text>
            <Text variant="footnote" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
              {t('workout.rest.of', { time: formatClock(totalSec) })}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.rest.minusLabel')}
            onPress={() => onAdjust(-REST_ADJUST_SEC)}
            style={adjust}
          >
            <Text
              variant="subheadline"
              style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}
            >
              {t('workout.rest.minus')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.rest.plusLabel')}
            onPress={() => onAdjust(REST_ADJUST_SEC)}
            style={adjust}
          >
            <Text
              variant="subheadline"
              style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}
            >
              {t('workout.rest.plus')}
            </Text>
          </Pressable>
        </View>

        {nextText ? (
          <View
            accessible
            style={{ alignSelf: 'stretch', paddingHorizontal: space.xxs, marginTop: space.md }}
          >
            <Text variant="footnote" color="label2">
              {t('workout.rest.next')}
            </Text>
            <Text variant="headline" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
              {nextText}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.skipLabel')}
          onPress={onSkip}
          style={{
            alignSelf: 'stretch',
            minHeight: size.button,
            marginTop: space.sm,
            borderRadius: radius.capsule,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.fill,
          }}
        >
          <Text variant="headline">{t('workout.rest.skipLong')}</Text>
        </Pressable>
      </GlassPanel>
    </Animated.View>
  );
}
