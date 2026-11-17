import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

/**
 * Treść przewijana pod pływającym przyciskiem albo paskiem gaśnie w tło ekranu,
 * zamiast prześwitywać pod nim (makieta design/v2: przejście od przezroczystości do tła na 75%).
 */
export function BottomFade({ height }: { height: number }) {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="0.75" stopColor={colors.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomFade)" />
      </Svg>
    </View>
  );
}
