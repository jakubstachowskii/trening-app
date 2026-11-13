// Lista z przeciąganiem (docs/DECISIONS.md #18). Każdy wiersz ma też akcje VoiceOver „wyżej / niżej”.
import { type ReactElement, type ReactNode, useCallback, useMemo } from 'react';
import { View } from 'react-native';
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
 * Lista jest głównym przewijanym widokiem, a nie zagnieżdżoną listą: zagnieżdżona liczy pozycję
 * z przesunięcia przewinięcia, które na iOS zawiera wcięcie pod nagłówkiem, i wiersz odjeżdżał od palca.
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
  const { colors, space, motion, reduceMotion } = useTheme();

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
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: space.xs,
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
      onDragEnd={onDragEnd}
      animationDuration={reduceMotion ? 0 : motion.duration.fast}
      ItemSeparatorComponent={() => <View style={{ height: space.xs }} />}
      renderItem={({ item, index }) => (
        <Row item={item} index={index} count={data.length} renderRow={renderRow} move={move} />
      )}
    />
  );
}
