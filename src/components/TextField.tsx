import { TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  hint?: string;
};

/** Pole tekstowe z etykietą nad polem i komunikatem błędu pod nim (ogłaszanym przez VoiceOver). */
export function TextField({ label, error, hint, multiline, ...rest }: Props) {
  const { colors, space, radius, size, font } = useTheme();

  return (
    <View style={{ gap: space.xxs }}>
      <Text variant="footnote" color="label2">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.label3}
        multiline={multiline}
        style={{
          minHeight: multiline ? size.touchMin * 2 : size.touchMin,
          paddingHorizontal: space.sm,
          paddingVertical: space.xs,
          borderRadius: radius.inner,
          borderCurve: 'continuous',
          backgroundColor: colors.fill,
          color: colors.label,
          fontSize: font.body.size,
          textAlignVertical: multiline ? 'top' : 'center',
          borderWidth: error ? 1 : 0,
          borderColor: error ? colors.danger : undefined,
        }}
        {...rest}
      />
      {error ? (
        <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="footnote" color="label2">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
