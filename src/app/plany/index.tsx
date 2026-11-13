import { Stack, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { HeaderIconButton } from '@/components/stack';
import { Text } from '@/components/Text';
import { listPlanSummaries, type PlanSummary } from '@/data/repositories/plans';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import { useDbQuery } from '@/data/useDbQuery';
import { t, tMaybe, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

function planSubtitle(plan: PlanSummary): string {
  return `${tPlural('units.days', plan.dayCount)} · ${tPlural('units.exercises', plan.exerciseCount)}`;
}

export default function PlansScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const { data, loading, error, reload } = useDbQuery(listPlanSummaries, 'plans');

  const plans = data ?? [];
  const active = plans.find((plan) => plan.isActive);
  const others = plans.filter((plan) => !plan.isActive);
  const openPlan = (id: string) => router.push({ pathname: '/plany/[id]', params: { id } });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderIconButton
              icon={{ ios: 'plus', web: 'add' }}
              label={t('plans.add')}
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
        {loading ? <Skeleton rows={3} /> : null}
        {error ? (
          <EmptyState
            title={t('common.errorTitle')}
            body={t('common.errorBody')}
            action={{ label: t('common.retry'), onPress: () => void reload() }}
          />
        ) : null}

        {active ? (
          <Section title={t('plans.active')}>
            <ListGroup>
              <ListRow
                title={active.name}
                subtitle={planSubtitle(active)}
                icon={{ ios: 'star.fill', web: 'star' }}
                onPress={() => openPlan(active.id)}
              />
            </ListGroup>
          </Section>
        ) : null}

        {!loading && !error && !plans.length ? (
          <EmptyState
            title={t('plans.emptyTitle')}
            body={t('plans.emptyBody')}
            action={{ label: t('plans.emptyAction'), onPress: () => router.push('/plany/nowy') }}
          />
        ) : null}

        {others.length ? (
          <Section title={t('plans.mine')}>
            <ListGroup>
              {others.map((plan) => (
                <ListRow
                  key={plan.id}
                  title={plan.name}
                  subtitle={planSubtitle(plan)}
                  onPress={() => openPlan(plan.id)}
                />
              ))}
            </ListGroup>
          </Section>
        ) : null}

        <Section title={t('plans.programs')}>
          <ListGroup>
            {BUILTIN_PROGRAMS.map((program) => (
              <ListRow
                key={program.id}
                title={tMaybe(`programs.${program.id}.name`) ?? program.id}
                subtitle={t('plans.programMeta', {
                  level: tMaybe(`levels.${program.level}`) ?? program.level,
                  days: tPlural('units.daysPerWeek', program.daysPerWeek),
                })}
                icon={{ ios: 'list.bullet.clipboard', web: 'assignment' }}
                onPress={() =>
                  router.push({
                    pathname: '/plany/program/[programId]',
                    params: { programId: program.id },
                  })
                }
              />
            ))}
          </ListGroup>
          <Text variant="footnote" color="label2" style={{ paddingHorizontal: space.xxs }}>
            {t('program.copyHint')}
          </Text>
        </Section>
      </ScrollView>
    </>
  );
}
