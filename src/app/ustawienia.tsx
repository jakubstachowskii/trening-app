import { ScrollView, Switch, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ListGroup } from '@/components/ListRow';
import { PopupMenu } from '@/components/PopupMenu';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { useDbQuery } from '@/data/useDbQuery';
import { WEEKLY_GOAL_DEFAULT, WEEKLY_GOAL_MAX, WEEKLY_GOAL_MIN } from '@/domain/week';
import { formatClock } from '@/domain/workout';
import {
  loadTrainingSettings,
  REST_OPTIONS_SEC,
  saveKeepAwake,
  saveRestDefault,
  saveWeeklyGoal,
  saveWeightStep,
  WEIGHT_STEPS_KG,
} from '@/features/settings/keys';
import { formatNumber, t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

type Choice = { value: number; label: string };

/** Ustawienia wg design/v2/Ustawienia — na razie sekcja „Trening” (wygląd i dane w fazie ustawień). */
export default function SettingsScreen() {
  const db = useDb();
  const { colors, space, size } = useTheme();
  const { data, reload } = useDbQuery((d) => loadTrainingSettings(d), 'settings');

  const rowStyle = {
    minHeight: size.touchMin + space.lg,
    paddingHorizontal: space.card,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    backgroundColor: colors.surface,
  };

  const pickerRow = (
    title: string,
    valueLabel: string,
    current: number,
    choices: Choice[],
    save: (value: number) => Promise<void>,
  ) => (
    <PopupMenu
      label={`${title}: ${valueLabel}`}
      title={title}
      items={choices.map((c) => ({
        label: c.value === current ? `${c.label} ✓` : c.label,
        onPress: () => void save(c.value).then(reload),
      }))}
    >
      <View style={rowStyle}>
        <Text variant="headline" style={{ flex: 1 }}>
          {title}
        </Text>
        <Text variant="body" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
          {valueLabel}
        </Text>
        <Icon
          name={{ ios: 'chevron.up.chevron.down', web: 'unfold_more' }}
          color={colors.label3}
          size={size.iconSmall}
        />
      </View>
    </PopupMenu>
  );

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={4} />
      </View>
    );
  }

  const goal = data.weeklyGoal ?? WEEKLY_GOAL_DEFAULT;
  const goals: Choice[] = [];
  for (let g = WEEKLY_GOAL_MIN; g <= WEEKLY_GOAL_MAX; g += 1) {
    goals.push({ value: g, label: tPlural('units.trainings', g) });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: space.screen, gap: space.section }}
    >
      <Section title={t('settings.training')}>
        <ListGroup>
          {pickerRow(t('settings.weeklyGoal'), tPlural('units.trainings', goal), goal, goals, (v) =>
            saveWeeklyGoal(db, v),
          )}
          {pickerRow(
            t('settings.restDefault'),
            formatClock(data.restDefaultSec),
            data.restDefaultSec,
            REST_OPTIONS_SEC.map((sec) => ({ value: sec, label: formatClock(sec) })),
            (v) => saveRestDefault(db, v),
          )}
          {pickerRow(
            t('settings.weightStep'),
            t('units.kg', { value: formatNumber(data.weightStepKg) }),
            data.weightStepKg,
            WEIGHT_STEPS_KG.map((kg) => ({
              value: kg,
              label: t('units.kg', { value: formatNumber(kg) }),
            })),
            (v) => saveWeightStep(db, v),
          )}
          <View style={rowStyle}>
            <Text variant="headline" style={{ flex: 1 }}>
              {t('settings.keepAwake')}
            </Text>
            <Switch
              accessibilityLabel={t('settings.keepAwakeLabel')}
              value={data.keepAwake}
              onValueChange={(on) => void saveKeepAwake(db, on).then(reload)}
              trackColor={{ true: colors.accent, false: colors.fill }}
            />
          </View>
        </ListGroup>
        <Text variant="footnote" color="label2" style={{ paddingHorizontal: space.xxs }}>
          {t('settings.trainingHint')}
        </Text>
      </Section>
    </ScrollView>
  );
}
