import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { notify } from '@/components/stack';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { getExercise } from '@/data/repositories/exercises';
import { addPlanExercise, getPlan, listPlans } from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { defaultPlanExercise } from '@/features/exercises/defaults';
import { t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

/** Arkusz „Dodaj do planu”: wybór dnia w jednym z planów. */
export default function AddToPlanSheet() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();

  const { data, loading } = useDbQuery(async (database) => {
    const plans = await listPlans(database);
    return Promise.all(plans.map((plan) => getPlan(database, plan.id)));
  }, 'add-to-plan');

  const add = async (planName: string, dayId: string, dayName: string) => {
    const exercise = await getExercise(db, exerciseId);
    if (!exercise) return;
    await addPlanExercise(db, dayId, defaultPlanExercise(exercise.id, exercise.type));
    router.back();
    notify(t('addToPlan.added', { plan: planName, day: dayName }));
  };

  const plans = (data ?? []).filter((plan) => plan !== null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: space.screen, gap: space.section }}
    >
      {loading ? <Skeleton rows={3} /> : null}
      {!loading && !plans.length ? (
        <EmptyState title={t('addToPlan.noPlansTitle')} body={t('addToPlan.noPlansBody')} />
      ) : null}
      {plans.map((plan) => (
        <Section key={plan.id} title={plan.name}>
          {plan.days.length ? (
            <ListGroup>
              {plan.days.map((day) => (
                <ListRow
                  key={day.id}
                  title={day.name}
                  subtitle={tPlural('units.exercises', day.exercises.length)}
                  showChevron={false}
                  onPress={() => void add(plan.name, day.id, day.name)}
                />
              ))}
            </ListGroup>
          ) : (
            <View style={{ paddingHorizontal: space.xxs }}>
              <Text variant="subheadline" color="label2">
                {t('addToPlan.noDays')}
              </Text>
            </View>
          )}
        </Section>
      ))}
    </ScrollView>
  );
}
