// Tylko podgląd w przeglądarce (zrzuty i testy ścieżek). Na iPhonie działa AppTabs.tsx z systemowym paskiem.
// Zastępczy pasek NativeTabs na web zasłania tytuł ekranu, więc tu zwykły dolny pasek (docs/DECISIONS.md).
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

type IconName = Parameters<typeof SymbolView>[0]['name'];

function icon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <SymbolView name={name} tintColor={color} size={size} />;
  }
  return TabIcon;
}

export function AppTabs() {
  const { colors, size } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.label2,
        tabBarStyle: {
          backgroundColor: colors.raised,
          borderTopColor: colors.separator,
          height: size.tabBar,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.start'),
          tabBarIcon: icon({ ios: 'house.fill', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="plany"
        options={{
          title: t('tabs.plans'),
          tabBarIcon: icon({ ios: 'list.bullet.rectangle.portrait', web: 'list_alt' }),
        }}
      />
      <Tabs.Screen
        name="cwiczenia"
        options={{
          title: t('tabs.exercises'),
          tabBarIcon: icon({ ios: 'dumbbell.fill', web: 'fitness_center' }),
        }}
      />
      <Tabs.Screen
        name="postepy"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: icon({ ios: 'chart.line.uptrend.xyaxis', web: 'show_chart' }),
        }}
      />
      <Tabs.Screen
        name="historia"
        options={{
          title: t('tabs.history'),
          tabBarIcon: icon({ ios: 'clock.arrow.circlepath', web: 'history' }),
        }}
      />
    </Tabs>
  );
}
