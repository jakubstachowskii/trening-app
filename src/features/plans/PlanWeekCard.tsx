// Karta aktywnego planu z tygodniem (design/v2/Plan.dc.html): nagłówek, segmenty i lista treningów tygodnia.
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatClock } from '@/domain/workout';
import { weekdayName } from '@/features/today/format';
import { formatNumber, t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

import type { PlanTabData, PlanTabRow } from './planTab';

type Props = {
  plan: NonNullable<PlanTabData['active']>;
  now: Date;
  busy: boolean;
  onStart: (dayId: string | null) => void;
  onOpenPlan: () => void;
};

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function PlanWeekCard({ plan, now, busy, onStart, onOpenPlan }: Props) {
  const { colors, space, size, radius } = useTheme();
  const marker = size.touchMin - space.md;

  const nextWhen = (row: Extract<PlanTabRow, { kind: 'next' }>): string | null => {
    if (row.date) return sameDay(row.date, now) ? t('planTab.today') : weekdayName(row.date);
    if (row.current) return plan.trainedToday ? t('planTab.next') : t('planTab.today');
    return null;
  };

  const renderRow = (row: PlanTabRow) => {
    if (row.kind === 'done') {
      const name = row.name ?? t('workout.emptyName');
      const meta = [
        weekdayName(row.date),
        row.durationSec != null ? formatClock(row.durationSec) : null,
        row.volumeKg ? t('units.kg', { value: formatNumber(Math.round(row.volumeKg)) }) : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return (
        <View
          key={row.key}
          accessible
          accessibilityLabel={`${t('planTab.doneLabel', { name })}, ${meta}`}
          style={rowStyle}
        >
          <View
            style={[
              markerStyle,
              { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <Icon
              name={{ ios: 'checkmark', web: 'check' }}
              color={colors.onAccent}
              size={size.iconSmall}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="headline">{name}</Text>
            <Text variant="footnote" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
              {meta}
            </Text>
          </View>
        </View>
      );
    }

    const name = row.name ?? t('workout.emptyName');
    const exercises = row.exerciseCount
      ? tPlural('units.exercises', row.exerciseCount)
      : t('planTab.emptyTraining');
    const when = nextWhen(row);
    const meta =
      when && row.current && row.exerciseCount
        ? t('planTab.nextMeta', { when, exercises, min: row.estimateMin })
        : [when, exercises].filter(Boolean).join(' · ');
    return (
      <View key={row.key} style={rowStyle}>
        <View
          accessible
          accessibilityLabel={`${name}, ${meta}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm }}
        >
          <View
            style={[
              markerStyle,
              row.current
                ? { borderWidth: 2, borderColor: colors.accent }
                : { borderWidth: 2, borderColor: colors.fill },
            ]}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="headline">{name}</Text>
            <Text
              variant="footnote"
              color={row.current ? 'accentText' : 'label2'}
              style={row.current ? { fontWeight: '600' } : undefined}
            >
              {meta}
            </Text>
          </View>
        </View>
        {row.current ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('planTab.startLabel', { name })}
            disabled={busy}
            onPress={() => onStart(row.dayId)}
            hitSlop={(size.touchMin - (size.touchMin - space.sm)) / 2}
            style={{
              minHeight: size.touchMin - space.sm,
              paddingHorizontal: space.md,
              borderRadius: radius.capsule,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              opacity: busy ? 0.4 : 1,
            }}
          >
            <Text variant="subheadline" color="onAccent" style={{ fontWeight: '700' }}>
              {t('planTab.start')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
    minHeight: size.touchMin + space.lg,
    paddingVertical: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  };
  const markerStyle = { width: marker, height: marker, borderRadius: marker / 2 };

  return (
    <Card style={{ paddingBottom: space.xxs, gap: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('planTab.openPlanHint')}
        onPress={onOpenPlan}
        style={{ gap: space.xxs, paddingBottom: space.sm }}
      >
        <Text
          variant="caption2"
          color="accentText"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}
        >
          {t('planTab.activeKicker', { week: plan.week })}
        </Text>
        <Text variant="brandL" accessibilityRole="header">
          {plan.name}
        </Text>
        <Text variant="subheadline" color="label2">
          {`${tPlural('units.trainingsPerWeek', plan.target)} · ${t('planTab.doneOf', {
            done: Math.min(plan.done, plan.target),
            total: plan.target,
          })}`}
        </Text>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('planTab.segmentsLabel', { done: plan.done, total: plan.target })}
          style={{ flexDirection: 'row', gap: space.xxs, marginTop: space.xs }}
        >
          {Array.from({ length: plan.target }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: size.segment,
                borderRadius: size.segment / 2,
                backgroundColor: i < plan.done ? colors.accent : colors.fill,
              }}
            />
          ))}
        </View>
      </Pressable>
      {plan.rows.map(renderRow)}
    </Card>
  );
}
