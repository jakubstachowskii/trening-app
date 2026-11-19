// Sterowanie treningiem w toku: zapis serii na bieżąco, klawiatura, minutnik, rekordy, zakończenie.
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { confirmDestructive, type MenuItem } from '@/components/stack';
import { useDb } from '@/data/DatabaseProvider';
import type { WorkoutSet } from '@/data/models';
import { getSetting, setSetting } from '@/data/repositories/settings';
import {
  addSet,
  completeWorkout,
  deleteSet,
  deleteWorkout,
  deleteWorkoutExercise,
  exerciseHistory,
  setWorkoutExerciseNote,
  updateSet,
} from '@/data/repositories/workouts';
import { useDbQuery } from '@/data/useDbQuery';
import {
  adjustRest,
  DEFAULT_REST_SEC,
  formatClock,
  followingSetsToUpdate,
  formatKeypadValue,
  hasPendingSets,
  initialExerciseIndex,
  type KeypadField,
  type KeypadKey,
  nextPendingSetIndex,
  parseKeypadValue,
  parseRestTimer,
  pressKey,
  primaryAction,
  recordsBrokenBySet,
  remainingSec,
  type RestTimerState,
  ringProgress,
  startRest,
  stepValue,
  usesDuration,
  usesReps,
  usesWeight,
} from '@/domain/workout';
import { DEFAULT_WEIGHT_STEP_KG } from '@/domain/suggestion';
import { nowIso } from '@/data/ids';
import { t } from '@/i18n';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

import type { Editing } from './CurrentExercise';
import { cancelRestEnd, scheduleRestEnd } from './notifications';
import { promptText } from './prompt';
import {
  formatSetDetail,
  loadSession,
  type Session,
  type SessionExercise,
  workingNumbers,
} from './session';
import { useNow } from './useNow';

import { loadTrainingSettings } from '@/features/settings/keys';

import { REST_SETTING } from './restStore';
type StoredRest = RestTimerState & { notificationId?: string | null };

/** Jak długo pasek przerwy mówi „Nowy rekord”. */
const RECORD_FLASH_MS = 3200;

type NextUp = { text: string; label: string };

const STEP: Record<KeypadField, number> = { weight: DEFAULT_WEIGHT_STEP_KG, reps: 1, duration: 5 };

const SETTINGS_KEY = 'settings';

function fieldsFor(item: SessionExercise): KeypadField[] {
  const type = item.exercise.type;
  return [
    ...(usesWeight(type) ? (['weight'] as const) : []),
    ...(usesReps(type) ? (['reps'] as const) : []),
    ...(usesDuration(type) ? (['duration'] as const) : []),
  ];
}

const valueOf = (set: WorkoutSet, field: KeypadField): number | null =>
  field === 'weight' ? set.weightKg : field === 'reps' ? set.reps : set.durationSec;

const withField = (set: WorkoutSet, field: KeypadField, value: number | null) => ({
  kind: set.kind,
  reps: field === 'reps' ? value : set.reps,
  weightKg: field === 'weight' ? value : set.weightKg,
  durationSec: field === 'duration' ? value : set.durationSec,
  completedAt: set.completedAt,
});

export function useWorkoutSession() {
  const db = useDb();
  const query = useDbQuery((d) => loadSession(d), 'active-workout');
  const session: Session | null | undefined = query.data;
  const reload = query.reload;
  // Ustawienia „Trening”: krok ciężaru na klawiaturze i przerwa, gdy ćwiczenie nie ma własnej.
  const settings = useDbQuery((d) => loadTrainingSettings(d), SETTINGS_KEY).data;
  const restDefaultSec = settings?.restDefaultSec ?? DEFAULT_REST_SEC;
  const weightStepKg = settings?.weightStepKg ?? DEFAULT_WEIGHT_STEP_KG;

  const [current, setCurrent] = useState(0);
  const initialized = useRef<string | null>(null);
  useEffect(() => {
    if (session && initialized.current !== session.id) {
      initialized.current = session.id;
      setCurrent(initialExerciseIndex(session.exercises));
    }
  }, [session]);
  const index = session ? Math.min(current, Math.max(0, session.exercises.length - 1)) : 0;
  const item = session?.exercises[index];

  // --- minutnik przerwy (stan w ustawieniach: przetrwa zamknięcie aplikacji) ---
  const [rest, setRest] = useState<StoredRest | null>(null);
  useEffect(() => {
    void getSetting<unknown>(db, REST_SETTING, null).then((value) => {
      const parsed = parseRestTimer(value);
      setRest(parsed ? { ...parsed, notificationId: (value as StoredRest).notificationId } : null);
    });
  }, [db]);
  const saveRest = useCallback(
    async (next: StoredRest | null) => {
      await setSetting(db, REST_SETTING, next);
      setRest(next);
    },
    [db],
  );
  const now = useNow(1000, Boolean(rest));
  const restLeft = rest ? remainingSec(rest, now) : 0;
  // Koniec przerwy: wibracja i schowanie minutnika dokładnie o czasie końca.
  useEffect(() => {
    if (!rest) return;
    const timer = setTimeout(
      () => {
        hapticSuccess();
        void saveRest(null);
      },
      Math.max(0, rest.endsAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [rest, saveRest]);
  const clearRest = useCallback(async () => {
    if (rest) await cancelRestEnd(rest.notificationId);
    await saveRest(null);
  }, [rest, saveRest]);

  // --- rekordy: plakietka w wierszu i chwilowa etykieta w pasku przerwy ---
  const [recordSetIds, setRecordSetIds] = useState<string[]>([]);
  const [recordFlash, setRecordFlash] = useState(false);
  useEffect(() => {
    if (!recordFlash) return;
    const timer = setTimeout(() => setRecordFlash(false), RECORD_FLASH_MS);
    return () => clearTimeout(timer);
  }, [recordFlash]);
  // Rozwinięty minutnik (stan widoku, nie w bazie).
  const [restExpanded, setRestExpanded] = useState(false);

  // --- stoper ćwiczeń na czas ---
  const [stopwatch, setStopwatch] = useState<{ start: number; index: number } | null>(null);
  const stopwatchStart = stopwatch && stopwatch.index === index ? stopwatch.start : null;
  const stopwatchNow = useNow(1000, stopwatchStart != null);
  const stopwatchSec =
    stopwatchStart != null ? Math.max(0, Math.floor((stopwatchNow - stopwatchStart) / 1000)) : null;

  // --- klawiatura ---
  const [editing, setEditing] = useState<Editing>(null);
  const replaceNext = useRef(false);

  const findSet = useCallback(
    (setId: string) => {
      for (const e of session?.exercises ?? []) {
        const set = e.sets.find((s) => s.id === setId);
        if (set) return { exercise: e, set };
      }
      return null;
    },
    [session],
  );

  /** Zapisuje wpisaną wartość (gdy się zmieniła). */
  const commit = useCallback(async () => {
    if (!editing) return;
    const found = findSet(editing.setId);
    if (!found) return;
    const value = parseKeypadValue(editing.text, editing.field);
    if (value === valueOf(found.set, editing.field)) return;
    const { set, exercise } = found;
    const field = editing.field;
    await updateSet(db, set.id, withField(set, field, value));
    // Kolejne serie z tą samą starą wartością dostają nową (jeden wpis zamiast czterech).
    const following = followingSetsToUpdate(
      exercise.sets,
      set.id,
      (x) => valueOf(x, field),
      valueOf(set, field),
    );
    for (const next of exercise.sets.filter((x) => following.includes(x.id))) {
      await updateSet(db, next.id, withField(next, field, value));
    }
  }, [db, editing, findSet]);

  const openEditor = useCallback(
    async (setId: string, field: KeypadField) => {
      await commit();
      const found = findSet(setId);
      if (!found) return;
      replaceNext.current = true;
      setEditing({ setId, field, text: formatKeypadValue(valueOf(found.set, field), field) });
      await reload();
    },
    [commit, findSet, reload],
  );

  const onKey = useCallback((key: KeypadKey) => {
    // Odczyt przed aktualizacją: funkcja w setEditing wykonuje się później niż ta linia.
    const replace = replaceNext.current;
    replaceNext.current = false;
    setEditing((e) => (e ? { ...e, text: pressKey(e.text, key, e.field, replace) } : e));
  }, []);

  const onStep = useCallback(
    (direction: 1 | -1) => {
      setEditing((e) => {
        if (!e) return e;
        // Krok ciężaru z Ustawień (ten sam, który pokazuje podpis klawisza).
        const value = stepValue(
          parseKeypadValue(e.text, e.field),
          direction,
          e.field,
          weightStepKg,
        );
        return { ...e, text: formatKeypadValue(value, e.field) };
      });
      replaceNext.current = true;
    },
    [weightStepKg],
  );

  const closeEditor = useCallback(async () => {
    await commit();
    setEditing(null);
    await reload();
  }, [commit, reload]);

  // --- serie ---
  const nextUp = useCallback((s: Session, afterSetId: string): NextUp | null => {
    const exercises = s.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((x) => (x.id === afterSetId ? { ...x, completedAt: 'done' } : x)),
    }));
    const ownerIndex = exercises.findIndex((e) => e.sets.some((x) => x.id === afterSetId));
    const action = primaryAction(exercises, ownerIndex);
    if (action.kind === 'finish') return null;
    const target =
      action.kind === 'complete' ? exercises[ownerIndex] : exercises[action.exerciseIndex];
    const setIndex = nextPendingSetIndex(target);
    const set = target.sets[setIndex];
    if (!set) return null;
    const label =
      set.kind === 'warmup'
        ? t('workout.warmupLabel')
        : String(workingNumbers(target.sets)[setIndex]);
    const values = formatSetDetail(target.exercise.type, set);
    if (action.kind !== 'complete') {
      return {
        text: values ? `${target.name} · ${values}` : target.name,
        label: t('workout.rest.thenNewExercise'),
      };
    }
    return {
      text: t('workout.rest.nextSet', { n: label, values }),
      label:
        set.kind === 'warmup'
          ? t('workout.rest.toWarmup')
          : t('workout.rest.toSet', { n: workingNumbers(target.sets)[setIndex] }),
    };
  }, []);
  const nextUpText = useCallback(
    (s: Session, afterSetId: string): string | null => nextUp(s, afterSetId)?.text ?? null,
    [nextUp],
  );

  const completeSet = useCallback(
    async (s: Session, owner: SessionExercise, set: WorkoutSet, override?: Partial<WorkoutSet>) => {
      const completedAt = nowIso();
      const done: WorkoutSet = { ...set, ...override, completedAt };
      await updateSet(db, set.id, done);
      hapticLight();

      const history = await exerciseHistory(db, owner.exerciseId);
      const kinds = recordsBrokenBySet({
        type: owner.exercise.type,
        history,
        doneBefore: owner.sets.filter((x) => x.completedAt && x.id !== set.id),
        justDone: done,
        workoutId: s.id,
        startedAt: s.startedAt,
        bodyweightKg: s.bodyweightKg,
      });
      if (kinds.length) {
        hapticSuccess();
        setRecordSetIds((ids) => (ids.includes(set.id) ? ids : [...ids, set.id]));
        setRecordFlash(true);
        AccessibilityInfo.announceForAccessibility(
          t('workout.record.announce', {
            kinds: kinds.map((k) => t(`records.${k}`)).join(', '),
          }),
        );
      }

      const after = s.exercises.map((e) => ({
        sets: e.sets.map((x) => (x.id === set.id ? done : x)),
      }));
      if (hasPendingSets(after)) {
        const total = owner.restSec ?? restDefaultSec;
        const nextText = nextUpText(s, set.id);
        if (rest) await cancelRestEnd(rest.notificationId);
        // Każda przerwa zaczyna się jako pasek.
        setRestExpanded(false);
        const state = startRest(total, set.id, Date.now());
        await saveRest(state);
        const notificationId = await scheduleRestEnd(
          total,
          nextText ?? t('workout.rest.notificationBody'),
        );
        if (notificationId) await saveRest({ ...state, notificationId });
      } else {
        await clearRest();
      }
    },
    [db, rest, saveRest, clearRest, nextUpText, restDefaultSec],
  );

  const toggleSet = useCallback(
    async (setId: string) => {
      if (!session) return;
      await commit();
      setEditing(null);
      const found = findSet(setId);
      if (!found) return;
      if (found.set.completedAt) {
        await updateSet(db, setId, { ...found.set, completedAt: null });
        setRecordSetIds((ids) => ids.filter((id) => id !== setId));
        if (rest?.setId === setId) await clearRest();
      } else {
        const pending =
          editing?.setId === setId ? parseKeypadValue(editing.text, editing.field) : undefined;
        const override =
          editing?.setId === setId && pending !== undefined
            ? {
                [editing.field === 'weight'
                  ? 'weightKg'
                  : editing.field === 'reps'
                    ? 'reps'
                    : 'durationSec']: pending,
              }
            : undefined;
        await completeSet(session, found.exercise, found.set, override);
      }
      await reload();
    },
    [session, commit, findSet, db, rest, clearRest, editing, completeSet, reload],
  );

  const onNextField = useCallback(async () => {
    if (!editing) return;
    const found = findSet(editing.setId);
    if (!found) return;
    const fields = fieldsFor(found.exercise);
    const nextField = fields[fields.indexOf(editing.field) + 1];
    if (nextField) {
      await commit();
      replaceNext.current = true;
      const latest = { ...found.set };
      const value = parseKeypadValue(editing.text, editing.field);
      if (editing.field === 'weight') latest.weightKg = value;
      if (editing.field === 'reps') latest.reps = value;
      setEditing({
        setId: editing.setId,
        field: nextField,
        text: formatKeypadValue(valueOf(latest, nextField), nextField),
      });
      await reload();
      return;
    }
    if (found.set.completedAt) {
      await closeEditor();
      return;
    }
    await toggleSet(editing.setId);
  }, [editing, findSet, commit, reload, closeEditor, toggleSet]);

  const addSetToCurrent = useCallback(async () => {
    if (!item) return;
    await commit();
    setEditing(null);
    const last = item.sets[item.sets.length - 1];
    await addSet(db, item.id, {
      kind: 'working',
      reps: last?.reps ?? null,
      weightKg: last?.weightKg ?? null,
      durationSec: last?.durationSec ?? null,
    });
    await reload();
  }, [item, commit, db, reload]);

  /** Akcje serii (małe menu z numeru serii). */
  const setMenuItems = useCallback(
    (setId: string): MenuItem[] => {
      const found = findSet(setId);
      if (!found) return [];
      const { set } = found;
      return [
        {
          label: set.kind === 'warmup' ? t('workout.makeWorking') : t('workout.makeWarmup'),
          onPress: () =>
            void updateSet(db, set.id, {
              ...set,
              kind: set.kind === 'warmup' ? 'working' : 'warmup',
            }).then(reload),
        },
        {
          label: t('workout.deleteSet'),
          destructive: true,
          onPress: () => {
            setEditing(null);
            void (async () => {
              if (rest?.setId === set.id) await clearRest();
              await deleteSet(db, set.id);
              await reload();
            })();
          },
        },
      ];
    },
    [findSet, db, reload, rest, clearRest],
  );

  /** Akcje bieżącego ćwiczenia (małe menu z „…” w karcie). */
  const exerciseMenuItems = useMemo((): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: t('workout.replaceExercise'),
        onPress: () => router.push({ pathname: '/trening/dodaj', params: { replace: item.id } }),
      },
      {
        label: t('workout.exerciseNote'),
        onPress: () =>
          promptText(t('workout.exerciseNotePrompt'), item.note ?? '', (text) => {
            void setWorkoutExerciseNote(db, item.id, text).then(reload);
          }),
      },
      {
        label: t('workout.removeExercise'),
        destructive: true,
        onPress: () => {
          const remove = async () => {
            setEditing(null);
            await deleteWorkoutExercise(db, item.id);
            await reload();
          };
          if (item.sets.some((s) => s.completedAt)) {
            confirmDestructive(
              t('workout.removeTitle', { name: item.name }),
              t('workout.removeBody'),
              t('common.delete'),
              () => void remove(),
            );
          } else {
            void remove();
          }
        },
      },
    ];
  }, [item, db, reload]);

  const onStopwatch = useCallback(async () => {
    if (!session || !item) return;
    if (stopwatchStart == null) {
      setStopwatch({ start: Date.now(), index });
      return;
    }
    const sec = Math.max(1, Math.round((Date.now() - stopwatchStart) / 1000));
    setStopwatch(null);
    const setIndex = nextPendingSetIndex(item);
    const set = item.sets[setIndex];
    if (set) {
      await completeSet(session, item, set, { durationSec: sec });
    } else {
      await addSet(db, item.id, { kind: 'working', durationSec: sec, completedAt: nowIso() });
    }
    await reload();
  }, [session, item, stopwatchStart, index, completeSet, db, reload]);

  // --- przerwa ---
  const onAdjustRest = useCallback(
    async (delta: number) => {
      if (!rest) return;
      const next = adjustRest(rest, delta, Date.now());
      await cancelRestEnd(rest.notificationId);
      const left = remainingSec(next, Date.now());
      const notificationId =
        left > 0
          ? await scheduleRestEnd(
              left,
              (session && nextUpText(session, rest.setId)) ?? t('workout.rest.notificationBody'),
            )
          : null;
      await saveRest(left > 0 ? { ...next, notificationId } : null);
    },
    [rest, saveRest, session, nextUpText],
  );

  // --- zakończenie ---
  const finish = useCallback(async () => {
    if (!session) return;
    await commit();
    setEditing(null);
    const run = async () => {
      await clearRest();
      const result = await completeWorkout(db, session.id);
      if (result === 'discarded') {
        router.back();
        return;
      }
      router.replace({ pathname: '/trening/podsumowanie', params: { id: session.id } });
    };
    const fresh = await loadSession(db, session.id);
    if (
      fresh &&
      hasPendingSets(fresh.exercises) &&
      fresh.exercises.some((e) => e.sets.some((s) => s.completedAt))
    ) {
      confirmDestructive(
        t('workout.finishTitle'),
        t('workout.finishBody'),
        t('workout.finishConfirm'),
        () => void run(),
      );
    } else if (fresh && !fresh.exercises.some((e) => e.sets.some((s) => s.completedAt))) {
      confirmDestructive(
        t('workout.finishTitle'),
        t('workout.finishEmptyBody'),
        t('workout.finishConfirm'),
        () => void run(),
      );
    } else {
      await run();
    }
  }, [session, commit, clearRest, db]);

  const discard = useCallback(() => {
    if (!session) return;
    confirmDestructive(
      t('workout.discardTitle'),
      t('workout.discardBody'),
      t('workout.discard'),
      () => {
        void (async () => {
          await clearRest();
          await deleteWorkout(db, session.id);
          router.back();
        })();
      },
    );
  }, [session, clearRest, db]);

  const action = useMemo(
    () => (session ? primaryAction(session.exercises, index) : ({ kind: 'finish' } as const)),
    [session, index],
  );

  const onPrimary = useCallback(async () => {
    if (!session) return;
    if (action.kind === 'complete' && item && usesDuration(item.exercise.type)) await onStopwatch();
    else if (action.kind === 'complete' && item) await toggleSet(item.sets[action.setIndex].id);
    else if (action.kind === 'nextExercise') {
      await closeEditor();
      setCurrent(action.exerciseIndex);
    } else await finish();
  }, [session, action, item, toggleSet, closeEditor, finish, onStopwatch]);

  /** Główny przycisk: dwie linie — co zrobi i z jakimi wartościami (makieta design/v2/Trening). */
  const primary = useMemo((): { label: string; detail?: string } => {
    if (action.kind === 'complete' && item) {
      const set = item.sets[action.setIndex];
      const n =
        set.kind === 'warmup'
          ? t('workout.warmupShort')
          : String(workingNumbers(item.sets)[action.setIndex]);
      if (usesDuration(item.exercise.type)) {
        if (stopwatchSec != null) {
          return {
            label: t('workout.stopwatch.stopSet', { n }),
            detail: formatClock(stopwatchSec),
          };
        }
        const target = set.durationSec ?? item.targetDurationSec;
        return {
          label: t('workout.stopwatch.start'),
          detail:
            target != null
              ? t('workout.stopwatch.target', { time: formatClock(target) })
              : t('workout.stopwatch.noTarget'),
        };
      }
      return {
        label: t('workout.primaryComplete', { n }),
        detail: formatSetDetail(item.exercise.type, set),
      };
    }
    if (action.kind === 'nextExercise' && session) {
      return {
        label: t('workout.primaryNextExercise'),
        detail: session.exercises[action.exerciseIndex]?.name,
      };
    }
    return { label: t('workout.primaryFinish') };
  }, [action, item, session, stopwatchSec]);

  const restNext = session && rest ? nextUp(session, rest.setId) : null;
  const editingSet = editing ? findSet(editing.setId) : null;
  const keypadNext = (() => {
    if (!editing || !editingSet) return '';
    const fields = fieldsFor(editingSet.exercise);
    const nextField = fields[fields.indexOf(editing.field) + 1];
    if (nextField === 'reps') return t('workout.keypad.nextReps');
    if (nextField) return t('workout.keypad.next');
    return editingSet.set.completedAt ? t('workout.keypad.done') : t('workout.keypad.complete');
  })();
  const keypadSetNumber = (() => {
    if (!editingSet || editingSet.set.kind === 'warmup') return null;
    const i = editingSet.exercise.sets.findIndex((x) => x.id === editingSet.set.id);
    return workingNumbers(editingSet.exercise.sets)[i] ?? null;
  })();

  return {
    keepAwake: settings?.keepAwake ?? true,
    query,
    session,
    index,
    item,
    selectExercise: async (i: number) => {
      await closeEditor();
      setCurrent(i);
    },
    editing,
    keypadNext,
    keypadSetNumber,
    keypadStep: editing ? (editing.field === 'weight' ? weightStepKg : STEP[editing.field]) : 1,
    openEditor,
    onKey,
    onStep,
    onNextField,
    closeEditor,
    toggleSet,
    addSetToCurrent,
    setMenuItems,
    exerciseMenuItems,
    rest: rest
      ? {
          left: restLeft,
          total: rest.totalSec,
          progress: ringProgress(rest, now),
          next: restNext?.text ?? null,
          label: recordFlash
            ? t('workout.record.title')
            : (restNext?.label ?? t('workout.rest.title')),
          highlight: recordFlash,
          expanded: restExpanded,
        }
      : null,
    expandRest: () => setRestExpanded(true),
    collapseRest: () => setRestExpanded(false),
    onAdjustRest,
    skipRest: clearRest,
    recordSetIds,
    stopwatchSec,
    primary,
    onPrimary,
    finish,
    discard,
  };
}
