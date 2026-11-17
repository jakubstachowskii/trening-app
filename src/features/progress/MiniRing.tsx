// Mały pierścień tygodnia w „Regularności” (design/v2/Postepy): ciągły łuk zrobione / cel.
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

type Props = { done: number; target: number };

export function MiniRing({ done, target }: Props) {
  const { colors, size } = useTheme();
  const d = size.icon;
  const stroke = size.progressBar;
  const r = (d - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = target > 0 ? Math.min(1, done / target) : 0;

  return (
    <Svg width={d} height={d} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={colors.fill} strokeWidth={stroke} />
      {progress > 0 ? (
        <Circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
        />
      ) : null}
    </Svg>
  );
}
