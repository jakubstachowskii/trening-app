// Gesty (F5): oficjalne atrapy biblioteki.
import 'react-native-gesture-handler/jestSetup';

// jest-expo zastępuje moduły natywne atrapami; expo-crypto potrzebuje prawdziwych UUID w testach bazy.
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

// Reanimated 4 nie ładuje się w Jest bez natywnego modułu, a jego atrapa wymaga go także.
// Ekrany używają tylko kilku funkcji, więc prosta atrapa wystarcza (ruch sprawdzamy na telefonie).
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View: RN.View, createAnimatedComponent: <T>(component: T) => component },
    useSharedValue: <T>(value: T) => ({ value }),
    useAnimatedStyle: () => ({}),
    withRepeat: <T>(value: T) => value,
    withTiming: <T>(value: T) => value,
    cancelAnimation: () => undefined,
    Easing: { inOut: () => () => 0, ease: () => 0 },
    runOnJS: <T>(fn: T) => fn,
  };
});

// Lista z przeciąganiem: w testach zwykła lista (przeciąganie sprawdzamy na telefonie,
// a zmianę kolejności przez akcje VoiceOver w testach ekranów).
jest.mock('react-native-reorderable-list', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    ScrollViewContainer: RN.ScrollView,
    NestedReorderableList: ({
      data,
      keyExtractor,
      renderItem,
    }: {
      data: unknown[];
      keyExtractor: (item: unknown) => string;
      renderItem: (info: { item: unknown; index: number }) => import('react').ReactNode;
    }) =>
      React.createElement(
        RN.View,
        null,
        data.map((item, index) =>
          React.createElement(
            React.Fragment,
            { key: keyExtractor(item) },
            renderItem({ item, index }),
          ),
        ),
      ),
    useReorderableDrag: () => () => undefined,
  };
});
