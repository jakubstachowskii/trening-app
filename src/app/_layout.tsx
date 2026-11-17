import { useFonts } from 'expo-font';
import { ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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
        <Stack.Screen name="ustawienia" options={{ title: t('settings.title') }} />
        {/* Pierwsze uruchomienie: pełny ekran bez zamykania gestem (wyjście tylko przyciskami). */}
        <Stack.Screen
          name="start/index"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, headerShown: false }}
        />
        <Stack.Screen name="start/plan" options={{ headerShown: false }} />
        <Stack.Screen
          name="trening/podsumowanie"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, headerShown: false }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

// Ekran powitalny czeka na krój Archivo (tytuły i liczby), żeby nic nie mignęło czcionką systemową.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'ArchivoExpanded-Bold': require('../../assets/fonts/ArchivoExpanded-Bold.ttf'),
    'ArchivoExpanded-ExtraBold': require('../../assets/fonts/ArchivoExpanded-ExtraBold.ttf'),
  });
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  // Błąd ładowania kroju nie blokuje aplikacji: zostaje czcionka systemowa.
  if (!ready) return null;

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
