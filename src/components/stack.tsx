// Wspólny wygląd systemowych nagłówków w stosach kart (docs/DECISIONS.md: nagłówki iOS).
import { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable } from 'react-native';

import { t } from '@/i18n';
import { useTheme } from '@/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';

type StackOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

/** Tło i kolory nagłówka z tokenów; duży tytuł włączają ekrany główne kart. */
export function useStackScreenOptions(): StackOptions {
  const { colors } = useTheme();
  return {
    headerTintColor: colors.accentText,
    headerTitleStyle: { color: colors.label },
    headerLargeTitleStyle: { color: colors.label },
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.bg },
    headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: colors.bg },
  };
}

/**
 * Opcje arkusza (formularze, filtry): systemowy arkusz iOS na całą wysokość, zamykany przesunięciem w dół.
 * Nie `formSheet` z wysokościami: na iPhonie treść ekranu z nagłówkiem stosu była w nim pusta.
 */
export function sheetOptions(title: string) {
  return ({ navigation }: { navigation: { goBack: () => void } }) => ({
    presentation: 'modal' as const,
    title,
    headerLeft: () => (
      <Button variant="text" label={t('common.cancel')} onPress={() => navigation.goBack()} />
    ),
  });
}

/** Przycisk ikony w nagłówku (44 × 44, z etykietą dla VoiceOver). Szkło dodaje system. */
export function HeaderIconButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors, size } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: size.touchMin,
        minHeight: size.touchMin,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} color={colors.accentText} size={size.icon} />
    </Pressable>
  );
}

export type MenuItem = { label: string; onPress: () => void; destructive?: boolean };

/** Systemowe menu akcji (iOS: arkusz akcji; gdzie indziej: okno z przyciskami). */
export function showMenu(title: string | undefined, items: MenuItem[]): void {
  if (Platform.OS === 'ios') {
    const destructiveIndex = items.findIndex((item) => item.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...items.map((item) => item.label), t('common.cancel')],
        cancelButtonIndex: items.length,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (index) => items[index]?.onPress(),
    );
    return;
  }
  if (Platform.OS === 'web') {
    // Podgląd w przeglądarce: pierwsza akcja po potwierdzeniu (tylko do sprawdzania ścieżek).
    const choice = window.prompt(
      [title, ...items.map((item, index) => `${index + 1}. ${item.label}`)]
        .filter(Boolean)
        .join('\n'),
    );
    const index = Number(choice) - 1;
    items[index]?.onPress();
    return;
  }
  Alert.alert(title ?? '', undefined, [
    ...items.map((item) => ({
      text: item.label,
      onPress: item.onPress,
      style: item.destructive ? ('destructive' as const) : ('default' as const),
    })),
    { text: t('common.cancel'), style: 'cancel' as const },
  ]);
}

/** Potwierdzenie nieodwracalnej akcji (usuwanie). */
export function confirmDestructive(
  title: string,
  body: string,
  confirmLabel: string,
  onConfirm: () => void,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${body}`)) onConfirm();
    return;
  }
  Alert.alert(title, body, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Krótka informacja (np. „Dodano do planu”). */
export function notify(message: string): void {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert(message);
}
