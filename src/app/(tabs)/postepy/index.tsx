import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useDbQuery } from '@/data/useDbQuery';
import { formatClock } from '@/domain/workout';
import { loadMonth, loadOverview, type MonthHistory } from '@/features/progress/progressData';
import { MiniRing } from '@/features/progress/MiniRing';
import { formatNumber, t, tPlural } from '@/i18n';
import { useTheme } from '@/theme';

type ProgressView = 'overview' | 'history';

function kickerStyle() {
  return { textTransform: 'uppercase' as const, letterSpacing: 0.6, fontWeight: '600' as const };
}

function monthTitle(year: number, month: number): string {
  const text = new Date(year, month, 1).toLocaleDateString('pl', {
    month: 'long',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function itemMeta(item: MonthHistory['items'][number]): string {
  const date = new Date(item.startedAt).toLocaleDateString('pl', { day: 'numeric', month: 'long' });
  return [
    date,
    item.durationSec != null ? formatClock(item.durationSec) : null,
    item.volumeKg ? t('units.kg', { value: formatNumber(Math.round(item.volumeKg)) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Kalendarz miesiąca: tydzień od poniedziałku, dni z treningiem zaznaczone. */
function MonthCalendar({ history, now }: { history: MonthHistory; now: Date }) {
  const { colors, space, size } = useTheme();
  const trained = new Set(history.items.map((i) => new Date(i.startedAt).getDate()));
  const first = new Date(history.year, history.month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(history.year, history.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const isToday = (d: number) =>
    now.getFullYear() === history.year && now.getMonth() === history.month && now.getDate() === d;
  const cell = (size.touchMin * 3) / 4;
  const initials = t('progress.weekInitials').split(',');

  return (
    <View accessible accessibilityLabel={t('progress.calendarLabel', { count: trained.size })}>
      <View style={{ flexDirection: 'row' }}>
        {initials.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            variant="caption2"
            color="label2"
            style={{ flex: 1, textAlign: 'center', ...kickerStyle() }}
          >
            {d}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space.xs }}>
        {cells.map((d, i) => (
          <View
            key={i}
            style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: space.xxs / 2 }}
          >
            {d ? (
              <View
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: cell / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: trained.has(d) ? colors.accent : undefined,
                  borderWidth: isToday(d) && !trained.has(d) ? 2 : 0,
                  borderColor: colors.accent,
                }}
              >
                <Text
                  variant="footnote"
                  color={trained.has(d) ? 'onAccent' : 'label2'}
                  style={{
                    fontVariant: ['tabular-nums'],
                    fontWeight: trained.has(d) ? '700' : '400',
                  }}
                >
                  {d}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Karta „Postępy” (design/v2/Postepy): Przegląd (Regularność) | Historia (kalendarz i lista). */
export default function ProgressScreen() {
  const router = useRouter();
  const { colors, space, size } = useTheme();
  const now = new Date();
  const [view, setView] = useState<ProgressView>('overview');
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const overview = useDbQuery((d) => loadOverview(d), 'progress-overview').data;
  const history = useDbQuery(
    (d) => loadMonth(d, month.year, month.month),
    `progress-month-${month.year}-${month.month}`,
  ).data;

  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const isCurrentMonth = month.year === now.getFullYear() && month.month === now.getMonth();

  if (!overview) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}>
        <Skeleton rows={3} />
      </View>
    );
  }

  if (overview.empty) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.screen }}
      >
        <Card style={{ gap: space.sm, alignItems: 'flex-start' }}>
          <Text variant="caption2" color="label2" style={kickerStyle()}>
            {t('progress.emptyKicker')}
          </Text>
          <Text variant="brandM" accessibilityRole="header">
            {t('progress.emptyTitle')}
          </Text>
          <Text variant="body" color="label2">
            {t('progress.emptyBody')}
          </Text>
          {/* Na „Dziś”, bo tam czeka zaplanowany trening (albo trening bez planu). */}
          <Button label={t('progress.emptyAction')} onPress={() => router.navigate('/')} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: space.xs,
        paddingBottom: space.section,
        gap: space.md,
      }}
    >
      <SegmentedControl
        accessibilityLabel={t('progress.viewLabel')}
        options={[
          { key: 'overview', label: t('progress.overview') },
          { key: 'history', label: t('progress.history') },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'overview' ? (
        <Card style={{ gap: space.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="caption2" color="label2" style={kickerStyle()}>
              {t('progress.regularity')}
            </Text>
            {overview.streak > 0 ? (
              <Text variant="footnote" color="accentText" style={{ fontWeight: '600' }}>
                {tPlural('progress.streak', overview.streak)}
              </Text>
            ) : null}
          </View>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('progress.regularityLabel', {
              full: overview.weeks.filter((w) => w.done >= overview.target).length,
              total: overview.weeks.length,
              streak: overview.streak,
            })}
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            {overview.weeks.map((w) => (
              <MiniRing key={w.weekStart.toISOString()} done={w.done} target={overview.target} />
            ))}
          </View>
          <Text variant="footnote" color="label2">
            {t('progress.regularityHint', { count: overview.target })}
          </Text>
        </Card>
      ) : null}

      {view === 'history' ? (
        history ? (
          <>
            <Card style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('progress.prevMonth')}
                  disabled={!history.anyBefore}
                  onPress={() => shiftMonth(-1)}
                  style={{
                    width: size.touchMin,
                    height: size.touchMin,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: history.anyBefore ? 1 : 0.4,
                  }}
                >
                  <Icon name={{ ios: 'chevron.left', web: 'chevron_left' }} size={size.iconSmall} />
                </Pressable>
                <Text variant="headline" style={{ flex: 1 }} accessibilityRole="header">
                  {monthTitle(history.year, history.month)}
                </Text>
                <Text variant="footnote" color="label2" style={{ fontVariant: ['tabular-nums'] }}>
                  {tPlural('units.trainings', history.items.length)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('progress.nextMonth')}
                  disabled={isCurrentMonth}
                  onPress={() => shiftMonth(1)}
                  style={{
                    width: size.touchMin,
                    height: size.touchMin,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isCurrentMonth ? 0.4 : 1,
                  }}
                >
                  <Icon
                    name={{ ios: 'chevron.right', web: 'chevron_right' }}
                    size={size.iconSmall}
                  />
                </Pressable>
              </View>
              <MonthCalendar history={history} now={now} />
            </Card>
            {history.items.length ? (
              <ListGroup>
                {history.items.map((item) => (
                  <ListRow
                    key={item.id}
                    title={item.name ?? t('workout.emptyName')}
                    subtitle={itemMeta(item)}
                    accessory={
                      item.records ? (
                        <View
                          accessible
                          accessibilityLabel={tPlural('progress.recordsBadge', item.records)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: space.xxs,
                            paddingHorizontal: space.xs,
                            minHeight: size.touchMin - space.lg,
                            borderRadius: size.touchMin,
                            backgroundColor: colors.accentSoft,
                          }}
                        >
                          <Icon
                            name={{ ios: 'trophy.fill', web: 'emoji_events' }}
                            color={colors.accentText}
                            size={size.iconSmall - space.xxs}
                          />
                          <Text variant="caption1" color="accentText" style={{ fontWeight: '700' }}>
                            {formatNumber(item.records)}
                          </Text>
                        </View>
                      ) : undefined
                    }
                    onPress={() =>
                      router.push({ pathname: '/postepy/trening/[id]', params: { id: item.id } })
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <Text variant="body" color="label2" style={{ paddingHorizontal: space.xxs }}>
                {t('progress.monthEmpty')}
              </Text>
            )}
          </>
        ) : (
          <Skeleton rows={3} />
        )
      ) : null}
    </ScrollView>
  );
}
