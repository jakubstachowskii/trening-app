// Lista z przeciąganiem (docs/DECISIONS.md #18). Każdy wiersz ma też akcje VoiceOver „wyżej / niżej”.
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { type ReactElement, type ReactNode, use, useCallback, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import ReorderableList, {
  type ReorderableListReorderEvent,
  useReorderableDrag,
} from 'react-native-reorderable-list';

import { t } from '@/i18n';
import { useTheme } from '@/theme';
import { hapticLight } from '@/utils/haptics';

export type RowControls = {
  /** Wywołaj przy przytrzymaniu (onLongPress), żeby zacząć przeciąganie. */
  drag: () => void;
  /** Akcje VoiceOver dla wiersza. */
  actions: { name: string; label: string; onAction: () => void }[];
  index: number;
  isFirst: boolean;
  isLast: boolean;
};

type Props<T> = {
  data: T[];
  keyOf: (item: T) => string;
  renderRow: (item: T, controls: RowControls) => ReactNode;
  /** Nowa kolejność po upuszczeniu albo po akcji VoiceOver. */
  onReorder: (ordered: T[]) => void;
  /** Treść ekranu nad listą (tytuł, opis, przyciski) i pod nią. */
  header?: ReactElement;
  footer?: ReactElement;
  /** Widok, gdy lista jest pusta. */
  empty?: ReactElement;
  /** Dodatkowy zapas pod listą (np. na pływający przycisk). */
  bottomSpace?: number;
};

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function Row<T>({
  item,
  index,
  count,
  renderRow,
  move,
}: {
  item: T;
  index: number;
  count: number;
  renderRow: Props<T>['renderRow'];
  move: (from: number, to: number) => void;
}) {
  const drag = useReorderableDrag();
  const { colors, radius } = useTheme();
  const actions = [
    ...(index > 0
      ? [{ name: 'moveUp', label: t('reorder.moveUp'), onAction: () => move(index, index - 1) }]
      : []),
    ...(index < count - 1
      ? [{ name: 'moveDown', label: t('reorder.moveDown'), onAction: () => move(index, index + 1) }]
      : []),
  ];
  return (
    <View
      style={{
        borderRadius: radius.card,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      {renderRow(item, { drag, actions, index, isFirst: index === 0, isLast: index === count - 1 })}
    </View>
  );
}

/**
 * Cały przewijany ekran z listą wierszy (każdy jako osobna karta) i przeciąganiem po przytrzymaniu.
 * Lista jest głównym przewijanym widokiem, a nie zagnieżdżoną listą.
 *
 * Miejsce pod przezroczystym nagłówkiem robimy sami (odstęp o wysokości nagłówka), a nie systemowym
 * wcięciem (`contentInsetAdjustmentBehavior="automatic"`). Z wcięciem przesunięcie przewinięcia na górze
 * jest ujemne, a biblioteka liczy pozycję wiersza od niego wprost; do tego po chwyceniu wiersza lista
 * podskakiwała o wysokość nagłówka i pod palcem lądował wiersz niżej (test na iPhonie).
 */
export function ReorderableRows<T>({
  data,
  keyOf,
  renderRow,
  onReorder,
  header,
  footer,
  empty,
  bottomSpace,
}: Props<T>) {
  const { colors, space, size, motion, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  // Treść wchodzi pod nagłówek tylko na iOS 26+ (systemowy, przezroczysty pasek; ten sam warunek
  // co w nawigacji). Gdzie indziej nagłówek stoi nad listą. Poza ekranem stosu (testy) nagłówka nie ma.
  const stackHeaderHeight = use(HeaderHeightContext) ?? 0;
  const contentUnderHeader = useMemo(() => Platform.OS === 'ios' && isLiquidGlassAvailable(), []);
  const headerHeight = contentUnderHeader ? stackHeaderHeight : 0;

  const move = useCallback(
    (from: number, to: number) => onReorder(moveItem(data, from, to)),
    [data, onReorder],
  );
  const handleReorder = ({ from, to }: ReorderableListReorderEvent) => move(from, to);

  // Przeciąganie dopiero po przytrzymaniu, żeby gest „wstecz” od krawędzi działał jak zwykle.
  const panGesture = useMemo(() => Gesture.Pan().activateAfterLongPress(520), []);

  const onDragEnd = useCallback(() => {
    'worklet';
    runOnJS(hapticLight)();
  }, []);

  return (
    <ReorderableList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="never"
      scrollIndicatorInsets={{ top: headerHeight }}
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: headerHeight + space.xs,
        paddingBottom: bottomSpace ?? space.section,
      }}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={empty}
      data={data}
      keyExtractor={keyOf}
      // Typ gestu z biblioteki jest starszy niż Gesture Handler 3 (ta sama klasa w działaniu, DECISIONS #18).
      panGesture={panGesture as never}
      onReorder={handleReorder}
      // Przewijanie przy przeciąganiu: strefy przy krawędziach zaczynają się nad paskiem kart i pod
      // nagłówkiem (tam, gdzie sięga palec), a lista przewija się szybciej niż domyślnie.
      autoscrollThreshold={0.15}
      autoscrollThresholdOffset={{ start: headerHeight, end: size.tabBar + insets.bottom }}
      autoscrollSpeedScale={1.5}
      onDragEnd={onDragEnd}
      animationDuration={reduceMotion ? 0 : motion.duration.fast}
      ItemSeparatorComponent={() => <View style={{ height: space.xs }} />}
      renderItem={({ item, index }) => (
        <Row item={item} index={index} count={data.length} renderRow={renderRow} move={move} />
      )}
    />
  );
}
