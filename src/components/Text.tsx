import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { type ColorName, type FontVariant, useTheme } from '@/theme';

type Props = TextProps & {
  variant?: FontVariant;
  color?: Extract<ColorName, 'label' | 'label2' | 'accentText' | 'onAccent' | 'danger'>;
};

/** Tekst ze skali iOS (tokens.font.scale). Dynamic Type działa przez systemowe skalowanie czcionki. */
export function Text({ variant = 'body', color = 'label', style, ...rest }: Props) {
  const { font, colors } = useTheme();
  const scale = font[variant];

  const base: TextStyle = {
    fontSize: scale.size,
    lineHeight: scale.lineHeight,
    fontWeight: String(scale.weight) as TextStyle['fontWeight'],
    color: colors[color],
    fontVariant: 'numeric' in scale && scale.numeric ? ['tabular-nums'] : undefined,
  };

  return <RNText style={[base, style]} {...rest} />;
}
