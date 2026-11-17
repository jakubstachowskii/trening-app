// Lista gotowych programów z jednym zdaniem „dla kogo” i plakietką „Polecany” (cel tygodnia).
import { useRouter } from 'expo-router';

import { ListGroup, ListRow } from '@/components/ListRow';
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
  const badge = t('planTab.recommended', { count: weeklyGoal });

  return (
    <ListGroup>
      {programs.map((program) => (
        <ListRow
          key={program.id}
          title={tMaybe(`programs.${program.id}.name`) ?? program.id}
          badge={program.id === recommended ? badge : undefined}
          subtitle={tMaybe(`programs.${program.id}.forWhom`) ?? ''}
          onPress={() =>
            router.push({
              pathname: '/plany/program/[programId]',
              params: { programId: program.id },
            })
          }
        />
      ))}
    </ListGroup>
  );
}
