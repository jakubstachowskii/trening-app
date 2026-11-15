import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import { EQUIPMENT, type Equipment, type Exercise, type Muscle, MUSCLES } from '@/data/models';
import {
  createCustomExercise,
  getExercise,
  updateCustomExercise,
} from '@/data/repositories/exercises';
import { useDbQuery } from '@/data/useDbQuery';
import type { ExerciseType } from '@/domain/types';
import { toggle } from '@/features/exercises/search';
import { t, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

const TYPES: ExerciseType[] = [
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
  'time',
];

function Chips({ children }: { children: ReactNode }) {
  const { space } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>{children}</View>;
}

function Form({ initial, onDone }: { initial: Exercise | null; onDone: () => void }) {
  const db = useDb();
  const { colors, space } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<ExerciseType>(initial?.type ?? 'weight_reps');
  const [primary, setPrimary] = useState<Muscle[]>(initial?.primaryMuscles ?? []);
  const [secondary, setSecondary] = useState<Muscle[]>(initial?.secondaryMuscles ?? []);
  const [equipment, setEquipment] = useState<Equipment>(initial?.equipment ?? 'barbell');
  const [note, setNote] = useState(initial?.note ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameError = submitted && !name.trim() ? t('customExercise.nameRequired') : null;
  const muscleError = submitted && !primary.length ? t('customExercise.primaryRequired') : null;

  const save = async () => {
    setSubmitted(true);
    if (!name.trim() || !primary.length || saving) return;
    setSaving(true);
    const input = {
      name,
      type,
      primaryMuscles: primary,
      secondaryMuscles: secondary.filter((m) => !primary.includes(m)),
      equipment,
      note: note.trim() || null,
    };
    try {
      if (initial) await updateCustomExercise(db, initial.id, input);
      else await createCustomExercise(db, input);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: initial ? t('customExercise.titleEdit') : t('customExercise.titleNew'),
          headerRight: () => (
            <Button variant="text" label={t('common.save')} onPress={() => void save()} />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.screen, gap: space.section }}
      >
        <TextField
          label={t('customExercise.name')}
          placeholder={t('customExercise.namePlaceholder')}
          value={name}
          onChangeText={setName}
          error={nameError}
          autoFocus={!initial}
          returnKeyType="done"
        />
        <Section title={t('customExercise.type')}>
          <Chips>
            {TYPES.map((ty) => (
              <Pill
                key={ty}
                label={tMaybe(`exerciseTypes.${ty}`) ?? ty}
                selected={type === ty}
                onPress={() => setType(ty)}
              />
            ))}
          </Chips>
        </Section>
        <Section title={t('customExercise.primary')}>
          <Chips>
            {MUSCLES.map((m) => (
              <Pill
                key={m}
                label={tMaybe(`muscles.${m}`) ?? m}
                selected={primary.includes(m)}
                onPress={() => setPrimary(toggle(primary, m))}
              />
            ))}
          </Chips>
          {muscleError ? (
            <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
              {muscleError}
            </Text>
          ) : null}
        </Section>
        <Section title={t('customExercise.secondary')}>
          <Chips>
            {MUSCLES.filter((m) => !primary.includes(m)).map((m) => (
              <Pill
                key={m}
                label={tMaybe(`muscles.${m}`) ?? m}
                selected={secondary.includes(m)}
                onPress={() => setSecondary(toggle(secondary, m))}
              />
            ))}
          </Chips>
        </Section>
        <Section title={t('customExercise.equipment')}>
          <Chips>
            {EQUIPMENT.map((e) => (
              <Pill
                key={e}
                label={tMaybe(`equipment.${e}`) ?? e}
                selected={equipment === e}
                onPress={() => setEquipment(e)}
              />
            ))}
          </Chips>
        </Section>
        <TextField
          label={t('customExercise.note')}
          placeholder={t('customExercise.notePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
        />
        <Button label={t('common.save')} onPress={() => void save()} disabled={saving} />
      </ScrollView>
    </View>
  );
}

/** Formularz własnego ćwiczenia; `?id=` = edycja istniejącego. */
export default function CustomExerciseSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors, space } = useTheme();
  const { data, loading } = useDbQuery(
    (db) => (id ? getExercise(db, id) : Promise.resolve(null)),
    `custom-${id ?? 'new'}`,
  );

  if (id && (loading || data === undefined)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={4} />
      </View>
    );
  }
  return <Form initial={data?.source === 'user' ? data : null} onDone={() => router.back()} />;
}
