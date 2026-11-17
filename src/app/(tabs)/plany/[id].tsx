import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { ReorderableRows } from '@/components/Reorderable';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { HeaderMenuButton } from '@/components/MenuButtons';
import { confirmDestructive } from '@/components/stack';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import type { PlanDay } from '@/data/models';
import {
  addPlanDay,
  deletePlan,
  getPlan,
  reorderPlanDays,
  setActivePlan,
  setPlanWeekdays,
} from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { t, tMaybe, tPlural } from '@/i18n';
import { WeekdayPicker } from '@/features/plans/WeekdayPicker';
import { useTheme } from '@/theme';

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space, size } = useTheme();
  const {
    data: plan,
    loading,
    reload,
  } = useDbQuery((database) => getPlan(database, id), `plan-${id}`);
  // Kolejność po przeciągnięciu widać od razu, zanim baza potwierdzi zapis.
  const [order, setOrder] = useState<PlanDay[] | null>(null);

  if (loading || plan === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={3} />
      </View>
    );
  }
  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <EmptyState title={t('common.notFound')} body="" />
      </View>
    );
  }

  const days = order ?? plan.days;

  const openDay = (dayId: string) =>
    router.push({ pathname: '/plany/dzien/[dayId]', params: { dayId } });

  const addDay = async () => {
    const dayId = await addPlanDay(
      db,
      plan.id,
      t('planDetail.newDayName', { count: days.length + 1 }),
    );
    openDay(dayId);
  };

  const reorder = async (next: PlanDay[]) => {
    setOrder(next);
    try {
      await reorderPlanDays(
        db,
        plan.id,
        next.map((day) => day.id),
      );
    } finally {
      await reload();
      setOrder(null);
    }
  };

  const toggleActive = async () => {
    await setActivePlan(db, plan.isActive ? null : plan.id);
    await reload();
  };

  const changeWeekdays = async (next: number[]) => {
    await setPlanWeekdays(db, plan.id, next);
    await reload();
  };

  const remove = () =>
    confirmDestructive(
      t('planDetail.deleteTitle', { name: plan.name }),
      t('planDetail.deleteBody'),
      t('common.delete'),
      async () => {
        await deletePlan(db, plan.id);
        router.back();
      },
    );

  const meta = [
    plan.level ? (tMaybe(`levels.${plan.level}`) ?? plan.level) : null,
    tPlural('units.trainings', days.length),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderMenuButton
              label={t('common.more')}
              title={plan.name}
              items={[
                {
                  label: t('planDetail.edit'),
                  onPress: () => router.push({ pathname: '/plany/nowy', params: { id: plan.id } }),
                },
                {
                  label: plan.isActive ? t('planDetail.unsetActive') : t('planDetail.setActive'),
                  onPress: () => void toggleActive(),
                },
                { label: t('planDetail.delete'), onPress: remove, destructive: true },
              ]}
            />
          ),
        }}
      />
      <ReorderableRows
        data={days}
        keyOf={(day) => day.id}
        onReorder={(next) => void reorder(next)}
        header={
          <View style={{ gap: space.section, paddingBottom: space.xs }}>
            <View style={{ gap: space.xs }}>
              <Text variant="title1" accessibilityRole="header">
                {plan.name}
              </Text>
              <Text variant="subheadline" color="label2">
                {meta}
              </Text>
              {plan.description ? <Text variant="body">{plan.description}</Text> : null}
              {plan.sourceProgramId ? (
                <Text variant="footnote" color="label2">
                  {t('planDetail.fromProgram')}
                </Text>
              ) : null}
            </View>
            {plan.isActive ? (
              <View
                accessible
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.xs,
                  minHeight: size.touchMin,
                }}
              >
                <Icon
                  name={{ ios: 'star.fill', web: 'star' }}
                  color={colors.accentText}
                  size={size.iconSmall}
                />
                <Text variant="subheadline" color="accentText">
                  {t('planDetail.isActive')}
                </Text>
              </View>
            ) : (
              <Button
                variant="secondary"
                icon={{ ios: 'star', web: 'star_border' }}
                label={t('planDetail.setActive')}
                onPress={() => void toggleActive()}
              />
            )}
            <Section title={t('planDetail.weekdays')}>
              <View style={{ gap: space.xs }}>
                <WeekdayPicker
                  value={plan.weekdays ?? []}
                  onChange={(next) => void changeWeekdays(next)}
                />
                <Text variant="footnote" color="label2" style={{ paddingHorizontal: space.xxs }}>
                  {t('planDetail.weekdaysHint')}
                </Text>
              </View>
            </Section>
            <Section
              title={t('planDetail.days')}
              action={
                <Button
                  variant="text"
                  label={t('planDetail.addDay')}
                  onPress={() => void addDay()}
                />
              }
            >
              {null}
            </Section>
          </View>
        }
        footer={
          days.length > 1 ? (
            <Text
              variant="footnote"
              color="label2"
              style={{ paddingHorizontal: space.xxs, paddingTop: space.xs }}
            >
              {t('reorder.hint')}
            </Text>
          ) : undefined
        }
        empty={
          <EmptyState
            title={t('planDetail.noDaysTitle')}
            body={t('planDetail.noDaysBody')}
            action={{ label: t('planDetail.addDay'), onPress: () => void addDay() }}
          />
        }
        renderRow={(day, controls) => (
          <ListRow
            title={day.name}
            subtitle={tPlural('units.exercises', day.exercises.length)}
            actions={controls.actions}
            onLongPress={controls.drag}
            delayLongPress={500}
            onPress={() => openDay(day.id)}
          />
        )}
      />
    </View>
  );
}
