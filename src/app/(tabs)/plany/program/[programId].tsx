import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FloatingButton, useFloatingButtonSpace } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Section } from '@/components/Section';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { copyProgram } from '@/data/repositories/plans';
import { BUILTIN_PROGRAMS } from '@/data/seed/programs';
import { exerciseName } from '@/features/exercises/search';
import { formatPlanExercise } from '@/features/plans/format';
import { t, tMaybe, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

/** Podgląd gotowego programu (tylko do odczytu) i kopiowanie do „moich planów”. */
export default function ProgramScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const bottom = useFloatingButtonSpace();
  const [copying, setCopying] = useState(false);
  const program = BUILTIN_PROGRAMS.find((p) => p.id === programId);

  if (!program) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <EmptyState title={t('common.notFound')} body="" />
      </View>
    );
  }

  const copy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const planId = await copyProgram(db, program, (key) => tMaybe(key) ?? key);
      router.replace({ pathname: '/plany/[id]', params: { id: planId } });
    } finally {
      setCopying(false);
    }
  };

  const level = tMaybe(`levels.${program.level}`) ?? program.level;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.screen, paddingBottom: bottom, gap: space.section }}
      >
        <View style={{ gap: space.xs }}>
          <Text variant="title1" accessibilityRole="header">
            {tMaybe(`programs.${program.id}.name`) ?? program.id}
          </Text>
          <Text variant="subheadline" color="label2">
            {`${level} · ${tPlural('units.daysPerWeek', program.daysPerWeek)}`}
          </Text>
          <Text variant="body">{tMaybe(`programs.${program.id}.description`) ?? ''}</Text>
        </View>
        {program.days.map((day) => (
          <Section
            key={day.key}
            title={tMaybe(`programs.${program.id}.days.${day.key}`) ?? day.key}
          >
            <ListGroup>
              {day.exercises.map((item, index) => (
                <ListRow
                  key={`${item.exerciseId}-${index}`}
                  title={exerciseName({ id: item.exerciseId, source: 'builtin', name: null })}
                  subtitle={formatPlanExercise({
                    targetSets: item.sets,
                    repsMin: item.repsMin ?? null,
                    repsMax: item.repsMax ?? null,
                    targetDurationSec: item.durationSec ?? null,
                    targetWeightKg: null,
                    restSec: item.restSec,
                  })}
                />
              ))}
            </ListGroup>
          </Section>
        ))}
        <Text variant="footnote" color="label2">
          {t('program.copyHint')}
        </Text>
      </ScrollView>
      <FloatingButton
        label={t('program.copy')}
        icon={{ ios: 'doc.on.doc', web: 'content_copy' }}
        disabled={copying}
        onPress={() => void copy()}
      />
    </View>
  );
}
