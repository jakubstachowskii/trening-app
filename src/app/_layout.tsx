import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { AppTabs } from '@/components/AppTabs';
import { ThemeProvider, useTheme } from '@/theme';

function Root() {
  const { colors } = useTheme();

  // Tło okna pod ekranami (bez białego mignięcia przy przejściach i w ciemnym motywie).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => undefined);
  }, [colors.bg]);

  return (
    <>
      <StatusBar style="auto" />
      <AppTabs />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
