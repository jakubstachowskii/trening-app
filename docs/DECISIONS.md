# Decyzje

Każda zależność i każda rozbieżność z planem (`docs/PLAN.md`): co, dlaczego, alternatywy i koszt.

## 1. Expo SDK 57 zamiast 58 (2026-11-03)

- **Co:** projekt na Expo SDK 57 (React Native 0.86, React 19.2), szablon `default@sdk-57`.
- **Dlaczego:** Expo Go w App Store obsługuje na razie SDK 57. Na SDK 58 Expo Go jest tylko przez TestFlight, a to wymaga płatnego konta Apple Developer. SDK 57 pozwala testować aplikację na iPhonie za darmo, od razu.
- **Plan:** przejście na SDK 58 (`npx expo install expo@^58 --fix`), gdy Expo Go w App Store je obsłuży.
- **Różnica w kodzie:** natywne karty importujemy z `expo-router/unstable-native-tabs` (w SDK 58: `expo-router/native-tabs`). Jedna linijka w `src/components/AppTabs.tsx`.

## 2. Zależności aplikacji

Wszystkie instalowane przez `npx expo install`, w wersjach dobranych do SDK 57.

| Paczka                                                    | Po co                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `expo`, `react`, `react-native`                           | podstawa aplikacji                                                              |
| `expo-router` (+ `expo-constants`, `expo-linking`)        | nawigacja plikowa i systemowy pasek kart (NativeTabs)                           |
| `react-native-screens`, `react-native-safe-area-context`  | wymagane przez expo-router                                                      |
| `react-native-reanimated`, `react-native-worklets`        | animacje z tokenów ruchu (od F4); w szablonie Expo, w Expo Go                   |
| `expo-symbols` (+ `expo-font`, wymagane przez nią)        | ikony SF Symbols na iOS, Material Symbols na web                                |
| `expo-glass-effect`                                       | Liquid Glass (iOS 26+) dla przycisków i kart od F4; fallback do zwykłego widoku |
| `expo-splash-screen`, `expo-status-bar`, `expo-system-ui` | ekran startowy, pasek stanu, tło okna w motywie                                 |
| `react-dom`, `react-native-web`                           | podgląd w przeglądarce (decyzja 5)                                              |

Usunięte z szablonu, bo na razie niepotrzebne: `@expo/ui`, `expo-device`, `expo-image`, `expo-web-browser`, `react-native-gesture-handler`. Wrócą, gdy będą potrzebne, z wpisem tutaj.

## 3. Narzędzia (devDependencies)

| Paczka                                                                                           | Po co                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `typescript`, `@types/react`, `@types/jest`, `@types/node`                                       | TypeScript strict. TS 6 nie dołącza już typów sam (`types` w tsconfig)                                              |
| `jest` 29, `jest-expo`, `@testing-library/react-native`                                          | testy jednostkowe i ekranów (jest-expo dla SDK 57 wymaga Jest 29)                                                   |
| `eslint` 9, `eslint-config-expo`, `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier` | lint i formatowanie wg dokumentacji Expo. ESLint 9, bo konfiguracja Expo dla SDK 57 nie jest sprawdzona z ESLint 10 |
| `expo-doctor`                                                                                    | sprawdzenie zgodności wersji z SDK (w CI); jako zależność, żeby wersja była stała                                   |
| `lefthook`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`                  | hooki gita: lint zmienionych plików i Conventional Commits                                                          |

## 4. Tokeny czytane wprost z `design/tokens.json`

- **Co:** `src/theme/tokens.ts` importuje JSON z `design/`. Brak kopii i generatora.
- **Dlaczego:** jedno źródło prawdy. Zmiana tokenu od razu działa w aplikacji, a testy kontrastu sprawdzają każdy akcent w obu motywach.
- **Pilnowanie:** reguła ESLint zabrania literałów kolorów w `src/` (poza testami). `app.json` nie może czytać tokenów, więc test porównuje kolory ekranu startowego z tokenami.
- Logika kontrastu jest w `src/theme/contrast.ts` (testy) i w `design/check-contrast.js` (szybkie sprawdzenie przy pracy nad tokenami, krok `pnpm contrast` w CI).

## 5. Podgląd w przeglądarce (react-native-web)

- **Co:** aplikacja uruchamia się też w przeglądarce (`pnpm web`). Służy do zrzutów ekranów i testów ścieżek bez iPhone'a.
- **Koszt:** dwie paczki i jeden plik `src/components/AppTabs.web.tsx`. Zastępczy pasek NativeTabs na web zasłaniał tytuł ekranu i ucinał piątą kartę, więc web ma zwykły dolny pasek.
- **Ograniczenie:** to przybliżenie, nie iOS. Szkło, systemowy pasek kart, Dynamic Type i haptyka sprawdzamy tylko na iPhonie.

## 6. Tłumaczenia bez biblioteki

- **Co:** `src/i18n/locales/pl.json` i funkcja `t()` z kluczami sprawdzanymi przez TypeScript.
- **Dlaczego:** na razie jest jeden język. Biblioteka (np. `expo-localization` + `i18n-js`) dojdzie razem z drugim językiem. Test już teraz pilnuje, żeby każdy kolejny plik języka miał te same klucze co polski.

## 7. Motyw, gdy system go nie podaje

- Gdy iOS nie zwraca motywu, aplikacja zostaje w ciemnym (główny motyw projektu). Wybór motywu i akcentu w ustawieniach: F8.

## 8. pnpm w trybie izolowanym

- Expo wspiera izolowane `node_modules` od SDK 54, więc nie ustawiamy `nodeLinker: hoisted`. `pnpm-workspace.yaml` pozwala tylko na skrypt instalacyjny `lefthook`.

## 9. Brak licencji open source

- Repozytorium jest publiczne, ale bez pliku `LICENSE` (szablon Expo dodawał MIT). Bez licencji kod można oglądać, ale nie wolno go kopiować ani używać.
