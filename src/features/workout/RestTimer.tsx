import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { GlassPanel } from '@/components/GlassPanel';
import { Text } from '@/components/Text';
import { formatClock } from '@/domain/workout';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

const RING = 64;
const STROKE = 6;
const R = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

type Props = {
  remainingSec: number;
  /** 1 = cała przerwa przed nami, 0 = koniec. */
  progress: number;
  nextText: string | null;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
};

/** Szklany minutnik przerwy z pierścieniem (makieta F2-Trening). */
export function RestTimer({ remainingSec, progress, nextText, onAdjust, onSkip }: Props) {
  const { colors, space, radius, size } = useTheme();
  const time = formatClock(remainingSec);
  const button =
    (main: boolean) =>
    ({ pressed }: { pressed: boolean }) => ({
      flex: 1,
      minHeight: size.touchMin,
      borderRadius: radius.capsule,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: main ? colors.accent : pressed ? colors.selected : colors.fill,
    });

  return (
    <GlassPanel style={{ gap: space.sm }}>
      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={t('workout.rest.remaining', { time })}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      >
        <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            stroke={colors.fill}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            stroke={colors.accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </Svg>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="footnote" color="label2">
            {t('workout.rest.title')}
          </Text>
          <Text variant="timer">{time}</Text>
          {nextText ? (
            <Text variant="footnote" color="label2" numberOfLines={1}>
              {t('workout.rest.nextUp', { text: nextText })}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.minusLabel')}
          onPress={() => onAdjust(-15)}
          style={button(false)}
        >
          <Text variant="subheadline" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {t('workout.rest.minus')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.plusLabel')}
          onPress={() => onAdjust(15)}
          style={button(false)}
        >
          <Text variant="subheadline" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {t('workout.rest.plus')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('workout.rest.skipLabel')}
          onPress={onSkip}
          style={button(true)}
        >
          <Text variant="subheadline" color="onAccent" style={{ fontWeight: '600' }}>
            {t('workout.rest.skip')}
          </Text>
        </Pressable>
      </View>
    </GlassPanel>
  );
}
