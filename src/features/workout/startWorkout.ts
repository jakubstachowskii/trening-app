// Start treningu z dowolnego miejsca (Start, dzień planu). Najpierw pyta o niedokończony trening.
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { loadTrainingSettings } from '@/features/settings/keys';

import type { Db } from '@/data/db';
import { latestBodyweight } from '@/data/repositories/bodyweight';
import { getSetting, setSetting } from '@/data/repositories/settings';
import {
  deleteWorkout,
  getUnfinishedWorkout,
  startEmptyWorkout,
  startWorkoutFromDay,
} from '@/data/repositories/workouts';
import { t } from '@/i18n';

import { cancelRestEnd } from './notifications';
import { REST_SETTING } from './restStore';

export const openWorkout = () => router.push('/trening');

async function discardUnfinished(db: Db, workoutId: string): Promise<void> {
  const rest = await getSetting<{ notificationId?: string | null } | null>(db, REST_SETTING, null);
  await cancelRestEnd(rest?.notificationId);
  await setSetting(db, REST_SETTING, null);
  await deleteWorkout(db, workoutId);
}

function askResumeOrDiscard(onResume: () => void, onDiscard: () => void): void {
  if (Platform.OS === 'web') {
    if (
      window.confirm(
        `${t('workout.start.unfinishedTitle')}\n\n${t('workout.start.unfinishedBody')}`,
      )
    )
      onResume();
    else onDiscard();
    return;
  }
  Alert.alert(t('workout.start.unfinishedTitle'), t('workout.start.unfinishedBody'), [
    { text: t('workout.start.unfinishedResume'), onPress: onResume, style: 'cancel' },
    { text: t('workout.start.unfinishedDiscard'), onPress: onDiscard, style: 'destructive' },
  ]);
}

/** `dayId` = trening z dnia planu; bez niego pusty trening. */
export async function beginWorkout(db: Db, dayId?: string): Promise<void> {
  const start = async () => {
    const bodyweightKg = (await latestBodyweight(db))?.weightKg ?? null;
    const { weightStepKg } = await loadTrainingSettings(db);
    if (dayId) await startWorkoutFromDay(db, dayId, { bodyweightKg, stepKg: weightStepKg });
    else await startEmptyWorkout(db, { bodyweightKg });
    openWorkout();
  };
  const unfinished = await getUnfinishedWorkout(db);
  if (!unfinished) {
    await start();
    return;
  }
  askResumeOrDiscard(openWorkout, () => {
    void (async () => {
      await discardUnfinished(db, unfinished.id);
      await start();
    })();
  });
}
