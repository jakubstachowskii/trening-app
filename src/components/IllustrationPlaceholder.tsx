import { View } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

/** Zastępnik ilustracji ćwiczenia do czasu właściwych ilustracji (docs/PLAN.md, faza F10). */
export function IllustrationPlaceholder({ exerciseName }: { exerciseName: string }) {
  const { colors, space, radius, size } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('exercise.illustrationLabel', { name: exerciseName })}
      style={{
        aspectRatio: 16 / 9,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
      }}
    >
      <Icon
        name={{ ios: 'figure.strengthtraining.traditional', web: 'fitness_center' }}
        color={colors.accentText}
        size={size.touchMin * 2}
      />
      <Text variant="footnote" color="label2">
        {t('exercise.illustrationSoon')}
      </Text>
    </View>
  );
}
