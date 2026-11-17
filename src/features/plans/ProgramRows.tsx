// Lista gotowych programów z jednym zdaniem „dla kogo” i plakietką „Polecany” (cel tygodnia).
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ListGroup, ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import type { RecommendedProgramId } from '@/domain/recommend';
import { t, tMaybe } from '@/i18n';

type Props = { recommended: RecommendedProgramId; weeklyGoal: number };

export function ProgramRows({ recommended, weeklyGoal }: Props) {
  const router = useRouter();
  // Polecany na górze: jeden wyraźny wybór zamiast czterech równorzędnych.
  const programs = [...BUILTIN_PROGRAMS].sort(
    (a, b) => Number(b.id === recommended) - Number(a.id === recommended),
  );

  return (
    <ListGroup>
      {programs.map((program) => {
        const name = tMaybe(`programs.${program.id}.name`) ?? program.id;
        const forWhom = tMaybe(`programs.${program.id}.forWhom`) ?? '';
        const isRecommended = program.id === recommended;
        const badge = t('planTab.recommended', { count: weeklyGoal });
        return (
          <ListRow
            key={program.id}
            title={name}
            subtitle={forWhom}
            accessibilityLabel={
              isRecommended ? `${name}, ${badge}, ${forWhom}` : `${name}, ${forWhom}`
            }
            accessory={
              isRecommended ? (
                <View style={{ maxWidth: '40%' }}>
                  <Text variant="caption2" color="accentText" style={{ fontWeight: '600' }}>
                    {badge}
                  </Text>
                </View>
              ) : undefined
            }
            onPress={() =>
              router.push({
                pathname: '/plany/program/[programId]',
                params: { programId: program.id },
              })
            }
          />
        );
      })}
    </ListGroup>
  );
}
