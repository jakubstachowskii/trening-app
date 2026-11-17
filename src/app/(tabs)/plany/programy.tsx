import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { ListGroup, ListRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useDbQuery } from '@/data/useDbQuery';
import { loadPlanTab } from '@/features/plans/planTab';
import { ProgramRows } from '@/features/plans/ProgramRows';
import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Gotowe programy z plakietką „Polecany” (z celu tygodnia). */
export default function ProgramsScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const { data } = useDbQuery((d) => loadPlanTab(d), 'plans');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: space.xs,
        paddingBottom: space.section,
        gap: space.md,
      }}
    >
      {data ? (
        <>
          <ListGroup>
            <ListRow
              title={t('onboarding.help')}
              subtitle={t('onboarding.helpBody')}
              icon={{ ios: 'questionmark.circle', web: 'help' }}
              onPress={() => router.push({ pathname: '/start', params: { again: '1' } })}
            />
          </ListGroup>
          <ProgramRows recommended={data.recommended} weeklyGoal={data.weeklyGoal} />
          <Text variant="footnote" color="label2">
            {t('program.copyHint')}
          </Text>
        </>
      ) : (
        <Skeleton rows={4} />
      )}
    </ScrollView>
  );
}
