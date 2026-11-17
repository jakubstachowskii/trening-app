import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/components/stack';
import { t } from '@/i18n';

export default function ProgressLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: t('screens.progress.title'), headerLargeTitleEnabled: true }}
      />
      <Stack.Screen name="trening/[id]" options={{ title: '' }} />
    </Stack>
  );
}
