import { Stack } from 'expo-router';

import { SHEET_OPTIONS, useStackScreenOptions } from '@/components/stack';
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
      <Stack.Screen name="nowy" options={{ ...SHEET_OPTIONS, title: t('planForm.titleNew') }} />
      <Stack.Screen
        name="cwiczenie/[id]"
        options={{ ...SHEET_OPTIONS, title: t('planExercise.title') }}
      />
      <Stack.Screen name="wybierz" options={{ presentation: 'modal', title: t('picker.title') }} />
    </Stack>
  );
}
