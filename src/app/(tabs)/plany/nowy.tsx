import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useDb } from '@/data/DatabaseProvider';
import type { Level, Plan } from '@/data/models';
import { createOwnPlan, getPlan, updatePlan } from '@/data/repositories/plans';
import { useDbQuery } from '@/data/useDbQuery';
import { t, tMaybe } from '@/i18n';
import { useTheme } from '@/theme';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

function Form({ initial }: { initial: Plan | null }) {
  const router = useRouter();
  const db = useDb();
  const { colors, space } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [level, setLevel] = useState<Level | null>(initial?.level ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSubmitted(true);
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const input = { name, description, level };
      if (initial) {
        await updatePlan(db, initial.id, input);
        router.back();
      } else {
        // Własny plan w dwóch krokach: nazwa → od razu aktywny plan z pierwszym treningiem do uzupełnienia.
        const { dayId } = await createOwnPlan(db, name, t('planDetail.newDayName', { count: 1 }));
        router.replace({ pathname: '/plany/dzien/[dayId]', params: { dayId } });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: initial ? t('planForm.titleEdit') : t('planForm.titleNew'),
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
          label={t('planForm.name')}
          placeholder={t('planForm.namePlaceholder')}
          value={name}
          onChangeText={setName}
          error={submitted && !name.trim() ? t('planForm.nameRequired') : null}
          autoFocus={!initial}
          returnKeyType="done"
        />
        {initial ? (
          <>
            <TextField
              label={`${t('planForm.description')} (${t('common.optional')})`}
              placeholder={t('planForm.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Section title={t('planForm.level')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
                <Pill
                  label={t('planForm.noLevel')}
                  selected={level === null}
                  onPress={() => setLevel(null)}
                />
                {LEVELS.map((value) => (
                  <Pill
                    key={value}
                    label={tMaybe(`levels.${value}`) ?? value}
                    selected={level === value}
                    onPress={() => setLevel(value)}
                  />
                ))}
              </View>
            </Section>
          </>
        ) : null}
        <Button label={t('common.save')} onPress={() => void save()} disabled={saving} />
      </ScrollView>
    </View>
  );
}

/** Nowy plan (sama nazwa) albo edycja (`?id=`): nazwa, opis, poziom. */
export default function PlanFormSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, space } = useTheme();
  const { data, loading } = useDbQuery(
    (db) => (id ? getPlan(db, id) : Promise.resolve(null)),
    `plan-form-${id ?? 'new'}`,
  );
  if (id && (loading || data === undefined)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={3} />
      </View>
    );
  }
  return <Form initial={data ?? null} />;
}
