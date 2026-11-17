// Systemowy pasek kart iOS z Expo Router (SDK 58+).
import { NativeTabs } from 'expo-router/native-tabs';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

/** Cztery karty jak w design/v2: Dziś, Plan, Postępy, Ćwiczenia. Systemowy pasek kart iOS (Liquid Glass na iOS 26+). Ikony: SF Symbols na iOS, Material na web. */
export function AppTabs() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.start')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plany">
        <NativeTabs.Trigger.Label>{t('tabs.plans')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="postepy">
        <NativeTabs.Trigger.Label>{t('tabs.progress')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="show_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cwiczenia">
        <NativeTabs.Trigger.Label>{t('tabs.exercises')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dumbbell.fill" md="fitness_center" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
