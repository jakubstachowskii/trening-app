import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { WEEKLY_GOAL_DEFAULT, WEEKLY_GOAL_MAX, WEEKLY_GOAL_MIN } from '@/domain/week';
import { skipOnboarding } from '@/features/onboarding/finish';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

const GOALS = Array.from(
  { length: WEEKLY_GOAL_MAX - WEEKLY_GOAL_MIN + 1 },
  (_, i) => WEEKLY_GOAL_MIN + i,
);

/**
 * Pierwsze uruchomienie, krok 1 z 2: jedno pytanie o liczbę treningów w tygodniu.
 * `?again=1` (z „Pomóż mi wybrać”): zamiast „Pomiń” jest „Anuluj”, nic się nie zapisuje.
 */
export default function OnboardingQuestion() {
  const router = useRouter();
  const db = useDb();
  const { again } = useLocalSearchParams<{ again?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, space, size, radius } = useTheme();
  const [goal, setGoal] = useState(WEEKLY_GOAL_DEFAULT);
  const tile = size.touchMin + space.sm;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.screen,
          paddingBottom: insets.bottom + space.md,
          gap: space.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            label={again ? t('onboarding.cancel') : t('onboarding.skip')}
            onPress={() => (again ? router.back() : void skipOnboarding(db, WEEKLY_GOAL_DEFAULT))}
          />
        </View>
        <Text variant="brandL" accessibilityRole="header">
          {t('onboarding.question')}
        </Text>
        <Text variant="body" color="label2">
          {t('onboarding.questionBody')}
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: space.xs }}>
          {GOALS.map((g) => {
            const selected = g === goal;
            return (
              <Pressable
                key={g}
                accessibilityRole="radio"
                accessibilityLabel={t('onboarding.goalOption', { count: g })}
                accessibilityState={{ checked: selected }}
                onPress={() => setGoal(g)}
                style={{
                  flex: 1,
                  height: tile,
                  borderRadius: radius.inner,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.raised : colors.surface,
                  borderWidth: 2,
                  borderColor: selected ? colors.accent : colors.surface,
                }}
              >
                <Text variant="brandMetric" color={selected ? 'label' : 'label2'}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="footnote" color="label2">
          {t('onboarding.dontKnow')}
        </Text>
        <View style={{ flex: 1 }} />
        <Button
          large
          label={t('onboarding.showPlan')}
          onPress={() =>
            router.push({
              pathname: '/start/plan',
              params: { goal: String(goal), ...(again ? { again: '1' } : {}) },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
