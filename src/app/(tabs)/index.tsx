import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useDb } from '@/data/DatabaseProvider';
import { useDbQuery } from '@/data/useDbQuery';
import { clampWeeklyGoal } from '@/domain/week';
import { formatClock } from '@/domain/workout';
import { formatNumber, t, tPlural } from '@/i18n';
import {
  dayInitial,
  dayName,
  formatNext,
  formatTodayDate,
  formatWhen,
} from '@/features/today/format';
import { WeekRing } from '@/features/today/WeekRing';
import { saveWeeklyGoal } from '@/features/settings/keys';
import { loadStartData, type StartData } from '@/features/workout/startData';
import { beginWorkout, openWorkout } from '@/features/workout/startWorkout';
import { useTheme } from '@/theme';

type Mode = 'before' | 'active' | 'after' | 'empty';

function modeOf(data: StartData): Mode {
  if (data.unfinished) return 'active';
  if (data.todayFinished) return 'after';
  if (!data.plan) return 'empty';
  return 'before';
}

/** Kółko −/+ celu tygodnia. */
function RoundButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors, size } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: size.touchMin,
        height: size.touchMin,
        borderRadius: size.touchMin / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.fill,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={{ ios: icon, web: icon === 'minus' ? 'remove' : 'add' }} size={size.iconSmall} />
    </Pressable>
  );
}

/** „Dziś” (makieta design/v2/Start): pierścień tygodnia z dzisiejszym treningiem, pasek dni, seria i rekord. */
export default function TodayScreen() {
  const db = useDb();
  const { colors, space, size, radius } = useTheme();
  const { data, loading, reload } = useDbQuery((d) => loadStartData(d), 'start');
  const [busy, setBusy] = useState(false);
  const now = new Date();

  const begin = async (dayId?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await beginWorkout(db, dayId);
    } finally {
      setBusy(false);
    }
  };

  const changeGoal = async (goal: number, delta: number) => {
    await saveWeeklyGoal(db, goal + delta);
    await reload();
  };

  const header = (
    <View>
      <Text variant="footnote" color="label2">
        {formatTodayDate(now)}
      </Text>
      <Text variant="brandXL" accessibilityRole="header">
        {t('screens.start.title')}
      </Text>
    </View>
  );

  if (loading || !data) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.md, gap: space.md }}
      >
        {header}
        <Skeleton rows={3} />
      </ScrollView>
    );
  }

  const mode = modeOf(data);
  const { target, done } = data;
  // Dziś to kolejny segment: pulsuje przed startem i w trakcie (o ile cel nie jest już zrobiony).
  // W dzień wolny (plan z wybranymi dniami) nic nie pulsuje — trening można zacząć, ale nie jest planowany.
  const pulseIndex =
    ((mode === 'before' && !data.restDay) || mode === 'active') && done < target ? done : null;
  const ringLabel =
    pulseIndex != null
      ? t('today.ringToday', { done, total: target })
      : t('today.ringPlanned', { done, total: target });

  const kicker = (text: string, accent = false) => (
    <Text
      variant="caption2"
      color={accent ? 'accentText' : 'label2'}
      style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}
    >
      {text}
    </Text>
  );
  const cta = (label: string, onPress: () => void, accessibilityLabel?: string, off = false) => (
    <View style={{ marginTop: space.sm + space.xxs / 2, minWidth: size.ringButton }}>
      <Button
        label={label}
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={busy || off}
        onPress={onPress}
      />
    </View>
  );

  const center = (() => {
    if (mode === 'active' && data.unfinished) {
      const name = data.unfinished.name ?? t('workout.emptyName');
      return (
        <>
          {kicker(t('today.active'), true)}
          <Text
            variant="brandXL"
            accessibilityRole="header"
            numberOfLines={1}
            style={{ marginTop: space.xxs + space.xxs / 2 }}
          >
            {name}
          </Text>
          <Text variant="footnote" color="label2">
            {t('today.activeBody')}
          </Text>
          {cta(t('today.resume'), openWorkout, t('today.resumeLabel', { name }))}
        </>
      );
    }
    if (mode === 'after' && data.todayFinished) {
      const f = data.todayFinished;
      return (
        <>
          {kicker(
            done > target
              ? tPlural('today.weekCount', done)
              : t('today.doneWeek', { done, total: target }),
            true,
          )}
          <Text
            variant="brandXL"
            accessibilityRole="header"
            style={{ marginTop: space.xxs + space.xxs / 2 }}
          >
            {t('today.done')}
          </Text>
          <Text
            variant="footnote"
            color="label2"
            numberOfLines={1}
            style={{ fontVariant: ['tabular-nums'], maxWidth: size.restRing }}
          >
            {t('today.doneMeta', {
              name: f.name ?? t('workout.emptyName'),
              time: formatClock(f.durationSec),
              volume: formatNumber(Math.round(f.volumeKg)),
            })}
          </Text>
          <View style={{ marginTop: space.sm + space.xxs / 2, minWidth: size.ringButton }}>
            <Button
              variant="secondary"
              label={t('today.summary')}
              onPress={() =>
                router.push({ pathname: '/trening/podsumowanie', params: { id: f.id } })
              }
            />
          </View>
        </>
      );
    }
    if (mode === 'empty') {
      const goal = data.weeklyGoal;
      return (
        <>
          {kicker(t('today.goalTitle'))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              marginTop: space.xxs / 2,
            }}
          >
            <RoundButton
              icon="minus"
              label={t('today.goalLess')}
              disabled={goal <= clampWeeklyGoal(0)}
              onPress={() => void changeGoal(goal, -1)}
            />
            <Text
              variant="brandGoal"
              accessibilityLiveRegion="polite"
              accessibilityLabel={t('today.goalValue', { count: goal })}
              style={{ minWidth: size.touchMin, textAlign: 'center' }}
            >
              {goal}
            </Text>
            <RoundButton
              icon="plus"
              label={t('today.goalMore')}
              disabled={goal >= clampWeeklyGoal(Number.MAX_SAFE_INTEGER)}
              onPress={() => void changeGoal(goal, 1)}
            />
          </View>
          <Text variant="footnote" color="label2">
            {tPlural('units.workoutsPerWeek', goal)}
          </Text>
          {cta(t('today.startEmpty'), () => void begin())}
        </>
      );
    }
    const day = data.nextDay;
    return (
      <>
        {kicker(
          data.restDay && data.nextTraining
            ? t('today.restDay', { when: formatNext(data.nextTraining, now) })
            : done < target
              ? t('today.ofWeek', { n: done + 1, total: target })
              : done > target
                ? tPlural('today.weekCount', done)
                : t('today.overGoal'),
        )}
        <Text
          variant="brandXL"
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ marginTop: space.xxs + space.xxs / 2, maxWidth: size.restRing }}
        >
          {day?.name ?? data.plan?.name}
        </Text>
        <Text variant="footnote" color="label2">
          {day && day.exercises.length
            ? t('today.dayMeta', {
                exercises: tPlural('units.exercises', day.exercises.length),
                min: data.estimateMin,
              })
            : t('today.emptyDay')}
        </Text>
        {cta(
          t('today.start'),
          () => void begin(day?.id),
          t('today.startLabel', { name: day?.name ?? '' }),
          !day || day.exercises.length === 0,
        )}
      </>
    );
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: space.md,
        paddingTop: space.xs,
        paddingBottom: space.section,
      }}
    >
      {header}

      <View style={{ marginTop: space.xxs }}>
        <WeekRing
          size={size.weekRing}
          stroke={size.weekRingStroke}
          segments={target}
          filled={done}
          pulseIndex={pulseIndex}
          accessibilityLabel={ringLabel}
        >
          <View style={{ alignItems: 'center', paddingHorizontal: space.xl }}>{center}</View>
        </WeekRing>
      </View>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        {data.days.map((d) => {
          const label = d.today
            ? d.done
              ? t('today.dayTodayDone', { day: dayName(d.date) })
              : t('today.dayToday', { day: dayName(d.date) })
            : d.done
              ? t('today.dayDone', { day: dayName(d.date) })
              : d.planned
                ? t('today.dayPlanned', { day: dayName(d.date) })
                : dayName(d.date);
          return (
            <View
              key={d.date.toISOString()}
              accessible
              accessibilityLabel={label}
              style={{ flex: 1, alignItems: 'center', gap: space.xxs + space.xxs / 2 }}
            >
              <Text
                variant="caption2"
                color="label2"
                style={{ textTransform: 'uppercase', fontWeight: '600' }}
              >
                {dayInitial(d.date)}
              </Text>
              <View
                style={{
                  width: size.touchMin - space.xs,
                  height: size.touchMin - space.xs,
                  borderRadius: radius.capsule,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: d.done ? colors.accentSoft : undefined,
                  // Jak w makiecie: dziś — ramka akcentu, zaplanowany — cienka ramka `fill`.
                  borderWidth: d.today ? 2 : d.planned && !d.done ? 1.5 : 0,
                  borderColor: d.today ? colors.accent : colors.fill,
                }}
              >
                <Text
                  variant="subheadline"
                  color={d.done ? 'accentText' : d.today || d.planned ? 'label' : 'label2'}
                  style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}
                >
                  {d.date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {mode === 'empty' ? (
        <>
          <View style={{ marginTop: space.md }}>
            <ListGroup>
              <ListRow
                title={t('today.choosePlan')}
                subtitle={t('today.choosePlanBody')}
                showChevron
                onPress={() => router.navigate('/plany')}
              />
              <ListRow
                title={t('today.ownPlan')}
                subtitle={t('today.ownPlanBody')}
                showChevron
                onPress={() => router.push('/plany/nowy')}
              />
            </ListGroup>
          </View>
          <Text
            variant="footnote"
            color="label2"
            style={{ textAlign: 'center', marginTop: space.sm, paddingHorizontal: space.xl }}
          >
            {t('today.noPlanNote')}
          </Text>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Card style={{ flex: 1, gap: space.xxs / 2, minHeight: size.tile }}>
              {kicker(t('today.streak'))}
              <Text variant="brandStat" style={{ marginTop: space.xxs + space.xxs / 2 }}>
                {data.streak}
              </Text>
              <Text variant="footnote" color="label2">
                {tPlural('today.streakUnit', data.streak)}
              </Text>
            </Card>
            <Card style={{ flex: 1, gap: space.xxs / 2, minHeight: size.tile }}>
              {kicker(t('today.lastRecord'))}
              {data.lastRecord ? (
                <>
                  <Text
                    variant="brandM"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ marginTop: space.xxs + space.xxs / 2 }}
                  >
                    {data.lastRecord.value}
                  </Text>
                  <Text variant="footnote" color="label2" numberOfLines={2}>
                    {data.lastRecord.exerciseName}
                  </Text>
                  <Text variant="footnote" color="label2">
                    {formatWhen(data.lastRecord.date, now)}
                  </Text>
                </>
              ) : (
                <>
                  <Text variant="headline" style={{ marginTop: space.xxs + space.xxs / 2 }}>
                    {t('today.noRecord')}
                  </Text>
                  <Text variant="footnote" color="label2">
                    {t('today.noRecordBody')}
                  </Text>
                </>
              )}
            </Card>
          </View>
          {mode === 'before' ? (
            <View style={{ alignSelf: 'center', marginTop: space.xs }}>
              <Button
                variant="text"
                label={t('today.withoutPlan')}
                disabled={busy}
                onPress={() => void begin()}
              />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
