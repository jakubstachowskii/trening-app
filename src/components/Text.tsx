import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { type ColorName, type FontVariant, tokens, useTheme } from '@/theme';

type Props = TextProps & {
  variant?: FontVariant;
  color?: Extract<ColorName, 'label' | 'label2' | 'accentText' | 'onAccent' | 'danger' | 'success'>;
};

const BRAND_FACES: Record<string, string> = tokens.font.brandFaces;

/**
 * Tekst ze skali iOS (tokens.font.scale). Dynamic Type działa przez systemowe skalowanie czcionki.
 * Warianty `brand*` i `timerLarge` używają kroju Archivo Expanded: każda grubość to osobny plik,
 * więc grubość wybiera krój, a `fontWeight` zostaje zwykły (bez sztucznego pogrubienia).
 */
export function Text({ variant = 'body', color = 'label', style, ...rest }: Props) {
  const { font, colors } = useTheme();
  const scale = font[variant];
  const brand = 'family' in scale && scale.family === 'brand';

  const base: TextStyle = {
    fontSize: scale.size,
    lineHeight: scale.lineHeight,
    fontWeight: brand ? 'normal' : (String(scale.weight) as TextStyle['fontWeight']),
    fontFamily: brand ? BRAND_FACES[String(scale.weight)] : undefined,
    letterSpacing: 'tracking' in scale ? scale.tracking * scale.size : undefined,
    color: colors[color],
    fontVariant: 'numeric' in scale && scale.numeric ? ['tabular-nums'] : undefined,
  };

  return <RNText style={[base, style]} {...rest} />;
}
