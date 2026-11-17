import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import { recommendProgram } from '@/domain/recommend';
import { clampWeeklyGoal } from '@/domain/week';
import { estimateDayMinutes } from '@/domain/workout';
import { finishOnboarding, type OnboardingExit } from '@/features/onboarding/finish';
import { t, tMaybe, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

/** Pierwsze uruchomienie, krok 2 z 2: jeden proponowany plan i jeden przycisk, który go ustawia. */
export default function OnboardingProposal() {
  const router = useRouter();
  const db = useDb();
  const params = useLocalSearchParams<{ goal?: string; again?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, space, size, radius } = useTheme();
  const [busy, setBusy] = useState(false);
  const goal = clampWeeklyGoal(Number(params.goal));
  const again = Boolean(params.again);
  const programId = recommendProgram(goal);
  const program = BUILTIN_PROGRAMS.find((p) => p.id === programId)!;
  const name = tMaybe(`programs.${program.id}.name`) ?? program.id;

  const finish = async (exit: OnboardingExit) => {
    if (busy) return;
    setBusy(true);
    try {
      await finishOnboarding(db, goal, exit, program.id, again);
    } finally {
      setBusy(false);
    }
  };

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.backLabel', { count: goal })}
          onPress={() => router.back()}
          style={{
            alignSelf: 'flex-start',
            minHeight: size.touchMin,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.xxs,
          }}
        >
          <Icon
            name={{ ios: 'chevron.left', web: 'chevron_left' }}
            color={colors.accentText}
            size={size.iconSmall}
          />
          <Text variant="subheadline" color="accentText" style={{ fontWeight: '600' }}>
            {t('onboarding.back', { count: goal })}
          </Text>
        </Pressable>

        <Card style={{ gap: space.sm }}>
          <Text
            variant="caption2"
            color="label2"
            style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}
          >
            {t('onboarding.proposalKicker')}
          </Text>
          <Text variant="brandL" accessibilityRole="header">
            {name}
          </Text>
          <Text variant="subheadline" color="label2">
            {t(`onboarding.why.${programId}`, { count: goal })}
          </Text>
          <View style={{ gap: space.xs }}>
            {program.days.map((day) => {
              const dayName = tMaybe(`programs.${program.id}.days.${day.key}`) ?? day.key;
              const meta = t('onboarding.trainingMeta', {
                exercises: tPlural('units.exercises', day.exercises.length),
                min: estimateDayMinutes(
                  day.exercises.map((e) => ({
                    targetSets: e.sets,
                    restSec: e.restSec,
                    targetDurationSec: e.durationSec ?? null,
                  })),
                ),
              });
              return (
                <View
                  key={day.key}
                  accessible
                  accessibilityLabel={`${dayName}, ${meta}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: space.sm,
                    minHeight: size.touchMin,
                    paddingHorizontal: space.sm,
                    borderRadius: radius.small,
                    backgroundColor: colors.raised,
                  }}
                >
                  <Text variant="subheadline" style={{ fontWeight: '600' }}>
                    {dayName}
                  </Text>
                  <Text variant="footnote" color="label2">
                    {meta}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text variant="footnote" color="label2">
            {t('onboarding.rotation')}
          </Text>
        </Card>

        <View style={{ flex: 1 }} />
        <Button
          large
          label={t('onboarding.choose')}
          disabled={busy}
          onPress={() => void finish('choose')}
        />
        <Button
          variant="text"
          label={t('onboarding.other')}
          disabled={busy}
          onPress={() => void finish('other')}
        />
        {again ? null : (
          <Button
            variant="text"
            label={t('onboarding.noPlan')}
            disabled={busy}
            onPress={() => void finish('noPlan')}
          />
        )}
      </ScrollView>
    </View>
  );
}
