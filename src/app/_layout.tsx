import { ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppTabs } from '@/components/AppTabs';
import { DatabaseProvider } from '@/data/DatabaseProvider';
import { ThemeProvider, useTheme } from '@/theme';
import { navigationTheme } from '@/theme/navigationTheme';

function Root() {
  const { colors, scheme } = useTheme();
  const navTheme = useMemo(() => navigationTheme(scheme, colors), [scheme, colors]);

  // Tło okna pod ekranami (bez białego mignięcia przy przejściach i w ciemnym motywie).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => undefined);
  }, [colors.bg]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <AppTabs />
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
