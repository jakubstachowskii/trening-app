import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';

/** Krótki tekst od użytkownika (notatka). iOS: systemowe okno z polem; web: prompt przeglądarki. */
export function promptText(title: string, initial: string, onSubmit: (text: string) => void): void {
  if (Platform.OS === 'web') {
    const value = window.prompt(title, initial);
    if (value !== null) onSubmit(value);
    return;
  }
  Alert.prompt(
    title,
    undefined,
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.save'), onPress: (value?: string) => onSubmit(value ?? '') },
    ],
    'plain-text',
    initial,
  );
}
