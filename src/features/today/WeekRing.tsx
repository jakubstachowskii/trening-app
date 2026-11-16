import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Średnica w pt. */
  size: number;
  stroke: number;
  /** Liczba segmentów (treningi w tygodniu). */
  segments: number;
  /** Ile segmentów jest pełnych. */
  filled: number;
  /** Segment, który pulsuje (dzisiejszy trening przed startem / w trakcie). */
  pulseIndex?: number | null;
  /** Segment, który domyka się animacją (podsumowanie). */
  closingIndex?: number | null;
  accessibilityLabel: string;
  children?: ReactNode;
};

/**
 * Pierścień tygodnia (makieta design/v2/Start): segment = trening, przerwy między segmentami wyśrodkowane
 * u góry. Przy Ogranicz ruch bez pulsowania i bez domykania (od razu stan końcowy).
 */
export function WeekRing({
  size,
  stroke,
  segments,
  filled,
  pulseIndex = null,
  closingIndex = null,
  accessibilityLabel,
  children,
}: Props) {
  const { colors, space, motion, reduceMotion } = useTheme();
  const n = Math.max(1, segments);
  const r = (size - stroke) / 2 - space.xxs;
  const circumference = 2 * Math.PI * r;
  // Widoczna przerwa = odstęp minus zaokrąglone końce kreski.
  const gap = stroke + space.xs;
  const seg = circumference / n;
  const dash = Math.max(0, seg - gap);
  const rotation = -90 + (gap / 2 / circumference) * 360;

  const [pulse] = useState(() => new Animated.Value(0.3));
  useEffect(() => {
    if (pulseIndex == null || reduceMotion) return;
    const half = motion.duration.illustrationLoop / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: half,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: half,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulseIndex, reduceMotion, motion.duration.illustrationLoop]);

  // Domykanie segmentu: długość kreski rośnie od 0 (raz, po wejściu na ekran).
  const [closing, setClosing] = useState(reduceMotion || closingIndex == null ? 1 : 0);
  useEffect(() => {
    if (closingIndex == null || reduceMotion) return;
    const value = new Animated.Value(0);
    const id = value.addListener(({ value: v }) => setClosing(v));
    const animation = Animated.timing(value, {
      toValue: 1,
      delay: motion.duration.slow - motion.duration.fast / 3,
      duration: motion.duration.chart,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      value.removeListener(id);
    };
  }, [closingIndex, reduceMotion, motion.duration]);

  const arc = (i: number, length: number) => ({
    strokeDasharray: `${length} ${circumference}`,
    strokeDashoffset: -i * seg,
  });

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: `${rotation}deg` }] }}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.fill}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
          />
          {Array.from({ length: Math.min(n, filled) }, (_, i) =>
            i === closingIndex ? null : (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={colors.accent}
                strokeWidth={stroke}
                strokeLinecap="round"
                {...arc(i, dash)}
              />
            ),
          )}
          {closingIndex != null && closingIndex < n ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={colors.accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              {...arc(closingIndex, dash * closing)}
              opacity={closing > 0 ? 1 : 0}
            />
          ) : null}
          {pulseIndex != null && pulseIndex < n ? (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={colors.accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              {...arc(pulseIndex, dash)}
              opacity={reduceMotion ? 0.5 : pulse}
            />
          ) : null}
        </Svg>
      </View>
      {children ? (
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
          {children}
        </View>
      ) : null}
    </View>
  );
}
