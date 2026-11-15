import { Stack } from 'expo-router';

import { sheetOptions, useStackScreenOptions } from '@/components/stack';
import { t } from '@/i18n';

export default function PlansLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: t('screens.plans.title'), headerLargeTitleEnabled: true }}
      />
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen name="dzien/[dayId]" options={{ title: '' }} />
      <Stack.Screen name="program/[programId]" options={{ title: '' }} />
      <Stack.Screen name="nowy" options={sheetOptions(t('planForm.titleNew'))} />
      <Stack.Screen name="cwiczenie/[id]" options={sheetOptions(t('planExercise.title'))} />
      <Stack.Screen name="wybierz" options={sheetOptions(t('picker.title'))} />
    </Stack>
  );
}
