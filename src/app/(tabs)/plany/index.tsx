import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { HeaderIconButton } from '@/components/stack';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import type { PlanSummary } from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { loadPlanTab } from '@/features/plans/planTab';
import { PlanWeekCard } from '@/features/plans/PlanWeekCard';
import { ProgramRows } from '@/features/plans/ProgramRows';
import { beginWorkout } from '@/features/workout/startWorkout';
import { t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

function planMeta(plan: PlanSummary): string {
  const trainings = tPlural('units.trainings', plan.dayCount);
  return plan.sourceProgramId
    ? t('planTab.programMeta', { trainings })
    : t('planTab.ownMeta', { trainings });
}

/** Karta „Plan” (design/v2/Plan): aktywny plan z tygodniem, pozostałe plany, gotowe programy. */
export default function PlansScreen() {
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const { data, loading, error, reload } = useDbQuery((d) => loadPlanTab(d), 'plans');
  const [busy, setBusy] = useState(false);
  const now = new Date();

  const openPlan = (id: string) => router.push({ pathname: '/plany/[id]', params: { id } });
  const start = async (dayId: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      await beginWorkout(db, dayId ?? undefined);
    } finally {
      setBusy(false);
    }
  };

  const others = data?.others ?? [];
  const otherPlans = others.length ? (
    <Section title={t('planTab.others')}>
      <ListGroup>
        {others.map((plan) => (
          <ListRow
            key={plan.id}
            title={plan.name}
            subtitle={planMeta(plan)}
            onPress={() => openPlan(plan.id)}
          />
        ))}
      </ListGroup>
    </Section>
  ) : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderIconButton
              icon={{ ios: 'plus', web: 'add' }}
              label={t('planTab.ownPlan')}
              onPress={() => router.push('/plany/nowy')}
            />
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: space.xs,
          paddingBottom: space.section,
          gap: space.section,
        }}
      >
        {loading && !data ? <Skeleton rows={3} /> : null}
        {error ? (
          <EmptyState
            title={t('common.errorTitle')}
            body={t('common.errorBody')}
            action={{ label: t('common.retry'), onPress: () => void reload() }}
          />
        ) : null}

        {data?.active ? (
          <>
            <PlanWeekCard
              plan={data.active}
              now={now}
              busy={busy}
              onStart={(dayId) => void start(dayId)}
              onOpenPlan={() => openPlan(data.active!.id)}
            />
            {otherPlans}
            <ListGroup>
              <ListRow
                title={t('planTab.browse')}
                subtitle={t('planTab.browseBody')}
                onPress={() => router.push('/plany/programy')}
              />
            </ListGroup>
          </>
        ) : null}

        {data && !data.active ? (
          <>
            <Text variant="body" color="label2">
              {t('planTab.emptyBody')}
            </Text>
            <ProgramRows recommended={data.recommended} weeklyGoal={data.weeklyGoal} />
            <View>
              <Button
                variant="secondary"
                label={t('planTab.ownPlan')}
                onPress={() => router.push('/plany/nowy')}
              />
            </View>
            {otherPlans}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
