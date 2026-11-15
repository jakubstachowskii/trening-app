import { ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { sheetOptions, useStackScreenOptions } from '@/components/stack';
import { DatabaseProvider } from '@/data/DatabaseProvider';
import { t } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme';
import { navigationTheme } from '@/theme/navigationTheme';

function Root() {
  const { colors, scheme } = useTheme();
  const navTheme = useMemo(() => navigationTheme(scheme, colors), [scheme, colors]);
  const screenOptions = useStackScreenOptions();

  // Tło okna pod ekranami (bez białego mignięcia przy przejściach i w ciemnym motywie).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => undefined);
  }, [colors.bg]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Trening: pełny ekran bez zamykania gestem (łatwo przypadkiem przesunąć palcem w trakcie serii). */}
        <Stack.Screen
          name="trening/index"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, headerShown: false }}
        />
        <Stack.Screen name="trening/dodaj" options={sheetOptions(t('workout.addExercise'))} />
        <Stack.Screen
          name="trening/podsumowanie"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, headerShown: false }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DatabaseProvider>
          <Root />
        </DatabaseProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
