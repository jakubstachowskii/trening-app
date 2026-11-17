// Powiadomienie lokalne o końcu przerwy (gdy aplikacja jest w tle albo ekran zgaszony).
// Tylko lokalne: bez serwera i bez push. Bez zgody działa wszystko poza samym powiadomieniem.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

let handlerSet = false;

/** Na pierwszym planie nie pokazujemy banera — minutnik widać na ekranie, wystarczy wibracja. */
function ensureHandler(): void {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Prosi o zgodę tylko raz (system sam nie pyta drugi raz). Zwraca, czy można wysyłać. */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

/** Planuje powiadomienie na koniec przerwy. Zwraca id albo null (web, brak zgody, błąd). */
export async function scheduleRestEnd(seconds: number, nextText: string): Promise<string | null> {
  if (Platform.OS === 'web' || seconds < 1) return null;
  try {
    ensureHandler();
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: t('workout.rest.notificationTitle'), body: nextText, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
      },
    });
  } catch {
    return null;
  }
}

export async function cancelRestEnd(id: string | null | undefined): Promise<void> {
  if (!id || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
