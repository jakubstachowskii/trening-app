# Decyzje

Każda zależność i każda rozbieżność z planem (`docs/PLAN.md`): co, dlaczego, alternatywy i koszt.

## 1. Expo SDK 58 (2026-11-05)

- **Co:** projekt na Expo SDK 58 (React Native 0.88, React 19.3), zgodnie z planem.
- **Historia:** 2026-11-03 wybraliśmy SDK 57, bo dokumentacja Expo podawała, że Expo Go w App Store obsługuje tylko SDK 57, a SDK 58 jest dostępne przez TestFlight (płatne konto Apple Developer). 2026-11-05 okazało się, że Expo Go 58.0.5 z obsługą SDK 58 jest już w App Store od tygodnia. Expo Go obsługuje jedno SDK naraz, więc projekt przeszedł na SDK 58 (`npx expo install expo@~58.0.23` i `npx expo install --fix`), zanim cokolwiek trafiło na main.
- **Kod:** natywne karty z `expo-router/native-tabs` (w SDK 57 było `expo-router/unstable-native-tabs`).

## 2. Zależności aplikacji

Wszystkie instalowane przez `npx expo install`, w wersjach dobranych do SDK 58.

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

| Paczka                                                                                           | Po co                                                                                                            |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `typescript`, `@types/react`, `@types/jest`, `@types/node`                                       | TypeScript strict. TS 6 nie dołącza już typów sam (`types` w tsconfig)                                           |
| `jest` 30, `jest-expo`, `@testing-library/react-native`                                          | testy jednostkowe i ekranów (jest-expo dla SDK 58 używa Jest 30)                                                 |
| `eslint` 9, `eslint-config-expo`, `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier` | lint i formatowanie wg dokumentacji Expo. ESLint 9, bo konfiguracja Expo nie jest jeszcze sprawdzona z ESLint 10 |
| `expo-doctor`                                                                                    | sprawdzenie zgodności wersji z SDK (w CI); jako zależność, żeby wersja była stała                                |
| `lefthook`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`                  | hooki gita: lint zmienionych plików i Conventional Commits                                                       |

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

- Expo wspiera izolowane `node_modules` od SDK 54, więc nie ustawiamy `nodeLinker: hoisted`. `pnpm-workspace.yaml` pozwala tylko na skrypt instalacyjny `lefthook`; `@parcel/watcher` (z Jest 30) ma gotowe binarki, więc jego budowanie ze źródeł jest wyłączone.

## 9. Brak licencji open source

- Repozytorium jest publiczne, ale bez pliku `LICENSE` (szablon Expo dodawał MIT). Bez licencji kod można oglądać, ale nie wolno go kopiować ani używać.

## 10. expo-doctor bez porównania wersji poprawkowych (2026-11-05)

- **Problem:** expo-doctor oblewa projekt, gdy tylko Expo wyda nowe poprawki paczek (np. `expo` 57.0.31 → 57.0.32). pnpm nie instaluje paczek młodszych niż 24 godziny (ochrona przed złośliwymi wersjami), więc przez dobę nie da się tego naprawić, a CI jest czerwone mimo dobrego kodu.
- **Co:** w CI i `pnpm ci:local` expo-doctor działa z `EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK=1`. Pozostałe jego sprawdzenia dalej blokują PR. Osobny krok `pnpm check:expo-versions` (`expo install --check`) tylko ostrzega o nowszych poprawkach.
- **Aktualizacje:** Renovate proponuje poprawki paczek Expo w jednym PR, najwcześniej 3 dni po publikacji. Większe aktualizacje (nowe SDK) robimy ręcznie przez `npx expo install --fix`.
- **Alternatywa odrzucona:** wyłączenie ochrony pnpm przed świeżymi wersjami.

## 11. Baza danych bez ORM (2026-11-05)

- **Co:** `expo-sqlite` i zwykłe SQL w małych repozytoriach (`src/data/repositories`). Bez Drizzle ani innego ORM.
- **Dlaczego:** 10 prostych tabel. ORM dodaje zależność, generator migracji i plugin Babel. Czytelne SQL z parametrami (`?`) wystarcza i chroni przed SQL injection: danych nigdy nie wklejamy w tekst zapytania.
- **Warstwa `Db`** (`src/data/db.ts`): `exec`, `run`, `all`, `first`, `transaction`. W aplikacji działa na `expo-sqlite` (`expoDb.ts`), w testach na wbudowanym w Node `node:sqlite` (`testing/nodeDb.ts`). Migracje i repozytoria testujemy na prawdziwym SQLite, bez nowych zależności.
- **Kolejka zapytań:** `withTransactionAsync` z `expo-sqlite` nie jest wyłączna (inne zapytania mogą się w nią wmieszać). Dlatego wszystkie zapytania idą przez jedną kolejkę, a transakcja to `BEGIN`/`COMMIT` w tej kolejce.

## 12. Migracje (2026-11-05)

- Ponumerowana lista stałego SQL w `src/data/migrations.ts`, wersja w `PRAGMA user_version`, historia w tabeli `schema_migration`. Każda migracja w transakcji: błąd cofa całość.
- `PRAGMA foreign_keys = ON` przy każdym połączeniu, WAL przy otwarciu bazy (zalecenie z dokumentacji `expo-sqlite`).
- Baza z nowszej wersji aplikacji (np. po cofnięciu aktualizacji) nie jest ruszana, tylko zgłaszany jest błąd.
- Istniejących migracji nie zmieniamy. Zmiana schematu = nowa migracja na końcu listy.

## 13. Model danych: różnice wobec `docs/PLAN.md` §4 (2026-11-05)

- `exercise.isCustom` → `exercise.source` (`builtin` / `user`), tak samo jak w planach. Nazwy gotowych ćwiczeń są w tłumaczeniach (`exercises.<id>`), w bazie mają `name = NULL`. `descriptionKey` i `illustrationKey` wynikają z id, więc nie mają kolumn.
- **Gotowe programy nie są w bazie.** Są w kodzie (`src/data/seed/programs.ts`). „Dodaj do moich planów” tworzy zwykły plan użytkownika (`plan.source_program_id` mówi, z czego powstał). Aktualizacja aplikacji nie może więc nadpisać zmian użytkownika w planie, a kolumna `plan.source` jest zbędna.
- Ćwiczenia z historią nie dają się usunąć (klucz obcy `RESTRICT`), tylko ukryć. Usunięcie planu nie usuwa treningów z historii (`ON DELETE SET NULL`).
- Masa ciała: jeden wpis na dzień (data lokalna `RRRR-MM-DD`).

## 14. Gotowe ćwiczenia z wersją (2026-11-05)

- 154 ćwiczenia w `src/data/seed/exercises.ts`, ze stałymi id (np. `bench-press`). Lista zaakceptowana przez właściciela 2026-11-05.
- `seedBuiltinData` wstawia albo odświeża je, gdy `EXERCISES_VERSION` jest większe niż zapisane w ustawieniach. Nie zmienia ukrycia ćwiczenia ani ćwiczeń użytkownika.
- Opisy wykonania i typowe błędy: F5.

## 15. `expo-crypto` do UUID (2026-11-05)

- **Co:** `randomUUID()` z `expo-crypto` (jest w Expo Go). Identyfikatory danych użytkownika to UUID, jak w `docs/PLAN.md` §4.
- **Dlaczego:** React Native nie daje globalnego `crypto.randomUUID`. W testach `jest.setup.ts` podstawia `randomUUID` z Node.

## 16. Obliczenia (2026-11-05)

- Czyste funkcje w `src/domain` (bez Reacta i bazy), każda z testami.
- Objętość i rekordy liczą tylko **ukończone serie robocze** (rozgrzewka się nie liczy).
- Ćwiczenia z masą ciała: obciążenie = masa ciała (+ obciążnik albo − guma), tylko gdy masa ciała jest znana.
- 1RM: Epley domyślnie, Brzycki do wyboru. Powyżej 12 powtórzeń wynik oznaczony jako orientacyjny.
- Podpowiedź ciężaru: progresja podwójna z najcięższej serii roboczej ostatniego treningu, krok domyślnie 2,5 kg.
- Pierwszy trening z ćwiczeniem nie jest pokazywany jako „nowy rekord”, a wyrównanie rekordu nie jest nowym rekordem.

## 17. `expo-sqlite` w podglądzie web (2026-11-05)

- `metro.config.js`: pliki `.wasm` jako zasoby i nagłówki COOP/COEP na serwerze podglądu (wymaga ich `SharedArrayBuffer`, z którego korzysta `expo-sqlite` na web).
