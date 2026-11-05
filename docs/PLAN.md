# Training App — specyfikacja

Status: **zaakceptowana 2026-11-03** (zmiany możliwe w trakcie, za zgodą).

## 1. Cel i zasada główna

Aplikacja na iOS do treningu siłowego na siłowni: planowanie treningów, zapis serii, powtórzeń i ciężaru, analiza progresu (wykresy, rekordy) i baza ćwiczeń z ilustracjami.

**Zasada główna: elastyczność.** Każdy użytkownik może:

- **dać się poprowadzić**: gotowe programy, podpowiedzi ciężaru, domyślne wykresy i rekordy (dla osób nowych na siłowni),
- **decydować sam**: własne plany, ćwiczenia, ustawienia i widoki postępów (dla zaawansowanych).

Rozsądne ustawienia domyślne, ale prawie wszystko da się zmienić.

Dla kogo: dla dowolnej osoby z App Store. Autor jest jednym z użytkowników, nie jedynym.

## 2. Ograniczenia i założenia

- Tylko iOS (na razie). Testowe urządzenie: iPhone 16 Pro. Praca na Windowsie, bez Maca.
- Dane tylko lokalnie w telefonie (SQLite). Bez konta, bez serwera, bez analityki i SDK śledzących.
- Język interfejsu: polski. Teksty w plikach tłumaczeń, gotowe na dodanie EN.
- Jednostki: kg (lb później, ale model danych od początku przechowuje kg i przelicza tylko przy wyświetlaniu).
- Motyw: zgodny z systemem, z wyborem jasny / ciemny / systemowy (przy pierwszym uruchomieniu i w ustawieniach).
- Konto Apple Developer: decyzja przed fazą kodu ekranów (F3), po sprawdzeniu, jakie SDK ma wtedy Expo Go w App Store.

## 3. Ekrany

Nawigacja: dolny pasek z 5 kartami: **Start, Plany, Ćwiczenia, Postępy, Historia**. Ustawienia otwierane z ikony na ekranie Start. Trening w toku otwiera się na pełnym ekranie.

### 3.1 Pierwsze uruchomienie (onboarding, 3–4 kroki, każdy z „Pomiń”)

1. **Doświadczenie**: „Dopiero zaczynam” / „Trenuję już jakiś czas” / „Zaawansowany”. Ustawia tryb prowadzony albo samodzielny (podpowiedzi, domyślne wykresy). Da się zmienić w ustawieniach.
2. **Motyw i akcent**: systemowy / jasny / ciemny oraz jeden z 5 kolorów akcentu, z podglądem na żywo.
3. **Masa ciała** (opcjonalnie): jedno pole, z wyjaśnieniem, po co (wykres, ćwiczenia z masą ciała). Można pominąć.
4. **Plan na start**: wybór gotowego programu albo „Zbuduję własny plan”.

### 3.2 Start

- Następny trening z aktywnego planu i przycisk „Zacznij”.
- „Pusty trening”: start bez planu, ćwiczenia dodawane na bieżąco.
- Skrót tygodnia: liczba treningów i ostatni trening.
- Ostatnio pobite rekordy.
- Wejście do ustawień.

### 3.3 Plany

- **Lista planów**: aktywny plan na górze, potem moje plany i gotowe programy.
- **Szczegóły planu**: dni treningowe (np. „Push”, „Pull”, „Nogi”), kolejność, opis, poziom.
- **Edycja dnia**: lista ćwiczeń, a przy każdym liczba serii, zakres powtórzeń, opcjonalny ciężar docelowy, przerwa i notatka. Kolejność zmieniana przeciąganiem.
- **Gotowe programy**: kopiowane do moich planów, potem można je dowolnie edytować.

### 3.4 Trening w toku

- Lista ćwiczeń dnia. Każde ćwiczenie rozwijane do tabeli serii: poprzedni wynik, ciężar, powtórzenia, odhaczenie.
- Typ serii: rozgrzewkowa / robocza (inne typy później).
- **Podpowiedź ciężaru** z poprzedniego treningu (włączana w ustawieniach, domyślnie włączona w trybie prowadzonym).
- **Minutnik przerwy** startuje po odhaczeniu serii. Czas domyślny z planu albo z ustawień, z przyciskami ±15 s i pominięciem.
- Dodanie, zamiana i usunięcie ćwiczenia w trakcie treningu, notatka do treningu i do ćwiczenia.
- Ćwiczenia na czas (np. plank) i z masą ciała (np. podciąganie, także z obciążnikiem lub z gumą).
- Trening przetrwa zamknięcie aplikacji: stan zapisywany na bieżąco.
- **Podsumowanie po zakończeniu**: czas, objętość, liczba serii, nowe rekordy.

### 3.5 Ćwiczenia (baza)

- Lista z wyszukiwarką i filtrami: partia mięśni, sprzęt, typ ćwiczenia.
- **Szczegóły ćwiczenia**: ilustracja lub animacja, zaangażowane mięśnie, krótki opis wykonania i typowe błędy, historia i rekordy z tego ćwiczenia.
- **Własne ćwiczenie**: nazwa, typ, mięśnie, sprzęt, notatka. Można je edytować i ukrywać.

### 3.6 Postępy

- **Wykres ćwiczenia**: wybór ćwiczenia i metryki (szacowane 1RM, najcięższa seria, objętość, najwięcej powtórzeń) oraz zakres czasu.
- **Rekordy**: lista rekordów z datami.
- **Masa ciała**: wykres i dodawanie wpisów (jeśli użytkownik włączył).
- **Konfiguracja widoku**: które wykresy i rekordy pokazywać. Zestaw domyślny zależy od poziomu doświadczenia.

### 3.7 Historia

- Lista treningów od najnowszych (z widokiem miesiąca jako opcją później).
- **Szczegóły treningu**: wszystkie serie. Można edytować i usunąć (z potwierdzeniem).

### 3.8 Ustawienia

- Poziom doświadczenia (tryb prowadzony / samodzielny), motyw, **kolor akcentu (5 gotowych: niebieski — domyślny, indygo, pomarańcz, malina, zieleń)**, jednostki (kg; lb później).
- Domyślna przerwa, podpowiedzi ciężaru, wzór na 1RM (Epley / Brzycki).
- Masa ciała: włącz / wyłącz.
- **Dane**: eksport do pliku, import z pliku, **usuń wszystkie dane** (z podwójnym potwierdzeniem).
- O aplikacji, polityka prywatności, licencje użytych zasobów.

## 4. Model danych (SQLite)

Ciężar zawsze w kg (liczba dziesiętna), czas w sekundach, daty jako ISO 8601 w UTC. Identyfikatory: UUID.

| Tabela             | Najważniejsze pola                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exercise`         | id, name, isCustom, type (`weight_reps` / `bodyweight_reps` / `weighted_bodyweight` / `assisted_bodyweight` / `time`), primaryMuscles, secondaryMuscles, equipment, descriptionKey, illustrationKey, isHidden |
| `plan`             | id, name, description, level, source (`builtin` / `user`), isActive, createdAt                                                                                                                                |
| `plan_day`         | id, planId, name, position                                                                                                                                                                                    |
| `plan_exercise`    | id, planDayId, exerciseId, position, targetSets, repsMin, repsMax, targetWeightKg?, targetDurationSec?, restSec?, note?                                                                                       |
| `workout`          | id, planDayId?, startedAt, finishedAt?, note?, bodyweightKg?                                                                                                                                                  |
| `workout_exercise` | id, workoutId, exerciseId, position, note?                                                                                                                                                                    |
| `workout_set`      | id, workoutExerciseId, position, kind (`warmup` / `working`), reps?, weightKg?, durationSec?, rpe? (pole na później), completedAt?                                                                            |
| `bodyweight_entry` | id, date, weightKg                                                                                                                                                                                            |
| `setting`          | key, value (JSON)                                                                                                                                                                                             |
| `schema_migration` | version, appliedAt                                                                                                                                                                                            |

- **Rekordy i wykresy nie są zapisywane.** Liczy je logika (czyste funkcje TypeScript z testami) z `workout_set`. Jeśli zacznie to działać wolno, dodamy pamięć podręczną.
- Gotowe ćwiczenia i programy są dostarczane z aplikacją i wstawiane przy pierwszym uruchomieniu oraz przy aktualizacjach (wersjonowanie danych).
- Eksport: jeden plik JSON z numerem wersji schematu. Import sprawdza wersję i poprawność danych przed zapisem.

## 5. Logika (z testami)

- Szacowane 1RM (Epley, Brzycki), objętość (serie × powtórzenia × kg; dla ćwiczeń z masą ciała z uwzględnieniem masy ciała, jeśli jest podana).
- Rekordy: najcięższa seria, najlepsze 1RM, najwięcej powtórzeń przy danym ciężarze, największa objętość w treningu.
- Podpowiedź ciężaru (MVP): prosta progresja podwójna. Gdy wszystkie serie robocze osiągnęły górny zakres powtórzeń, podpowiedz +2,5 kg (krok konfigurowalny). W przeciwnym razie ten sam ciężar.
- Statystyki tygodnia, zakresy dat na wykresach.
- Walidacja i migracja importowanych danych.

## 6. Zakres: MVP i później

**MVP (pierwsza wersja do używania na siłowni):**

- onboarding, Start, Plany (własne + kilka gotowych programów), Trening w toku z minutnikiem i podpowiedzią, Historia, Postępy (wykresy, rekordy, masa ciała), baza ćwiczeń z własnymi ćwiczeniami, Ustawienia, eksport, import i usunięcie danych,
- PL, motyw jasny / ciemny / systemowy, pełna dostępność (VoiceOver, Dynamic Type, kontrast, 44 pt, Reduce Motion).

**Później (po MVP, kolejność do ustalenia):**

- RPE / RIR i więcej typów serii (drop set, do upadku, superserie),
- jednostki lb, wersja EN,
- pomiary ciała (obwody),
- bardziej rozbudowane progresje i gotowe programy (na podstawie aplikacji, które przyślesz jako wzór),
- synchronizacja przez iCloud, Apple Health, widżety, Apple Watch,
- widok kalendarza w historii.

## 7. Stack (do potwierdzenia aktualną dokumentacją na starcie każdej fazy)

- **Expo (React Native) + TypeScript strict**, nawigacja: Expo Router.
- **SQLite**: `expo-sqlite`. Ewentualna warstwa ORM (np. Drizzle) dopiero po porównaniu w `docs/DECISIONS.md`.
- **Animacje**: React Native Reanimated, z obsługą Reduce Motion. **Wykresy**: biblioteka do wyboru w fazie wykresów (kryteria: wydajność, dostępność, licencja).
- **Tłumaczenia**: biblioteka i18n do wyboru (np. i18next) + `expo-localization`.
- **Testy**: Jest + React Native Testing Library. Logika domenowa w osobnych modułach bez Reacta.
- **Jakość**: ESLint, Prettier, commitlint (Conventional Commits), hooki git, CI na GitHub Actions (akcje przypięte do SHA), Renovate, `pnpm ci:local` (te same kroki co CI na czystej kopii commitu).
- **Buildy**: EAS (chmura). Testy na iPhonie: Expo Go albo development build, zależnie od decyzji o koncie Apple przed F3.

Każda zależność trafia do `docs/DECISIONS.md` z uzasadnieniem, alternatywami i kosztem.

## 8. Baza ćwiczeń i ilustracje

- **Lista ćwiczeń i opisy piszemy sami** (same nazwy ćwiczeń nie są chronione). Cel na MVP: wszystkie powszechnie znane ćwiczenia na siłownię (orientacyjnie 150–250; dokładna lista do akceptacji w F4).
- **Cudze zdjęcia odpadają:**
  - free-exercise-db: pochodzenie zdjęć nieopisane,
  - wger: licencje różne dla poszczególnych zdjęć.

  Ilustracje mają być własne, ładne i w jednym stylu. Sposób ich przygotowania (np. wektory lub animacje robione przez nas, kupiony pakiet z licencją na aplikacje, ilustrator) ustalimy w osobnej fazie F9. Do tego czasu w aplikacji są estetyczne zastępniki (np. schemat partii mięśni).

- Każdy zewnętrzny zasób: licencja sprawdzona i zapisana w `docs/DECISIONS.md` oraz na ekranie „Licencje”.

## 9. Prywatność

- Minimum danych: brak konta, imienia, e-maila i lokalizacji. Masa ciała opcjonalna.
- Dane tylko w telefonie, aplikacja nie łączy się z siecią w celu przesyłania danych.
- „Usuń wszystkie dane” w ustawieniach.
- Przed publikacją: polityka prywatności (strona WWW) i etykiety prywatności App Store.

## 10. Fazy pracy

Jedna faza = jedna gałąź = jeden PR (od F3, gdy powstanie repo). Przed każdą fazą: plan w trybie planowania i Twoja zgoda. Po fazie: pokaz i Twoje OK.

| Faza                           | Zakres                                                                                                                                                                                            | Kryteria akceptacji                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **F0 Specyfikacja**            | Ten dokument                                                                                                                                                                                      | Akceptacja Jakuba                                                                                    |
| **F1 Projekty ekranów**        | Interaktywne podglądy kluczowych ekranów (Start, Trening w toku, Postępy, Ćwiczenie) w 2–3 kierunkach wizualnych; Jakub przysyła wzory aplikacji                                                  | Jakub wybiera kierunek i zgłasza poprawki; zatwierdzone ekrany                                       |
| **F2 Design system**           | Tokeny: kolory (jasny / ciemny), typografia z Dynamic Type, odstępy, promienie, cienie, czasy i krzywe animacji; podgląd komponentów                                                              | Kontrast WCAG AA w obu motywach; Jakub zatwierdza; od tej chwili wygląd zmieniany tylko za zgodą     |
| **F3 Fundament repo**          | Repo GitHub (publiczne), Expo + TS strict, struktura, tokeny w kodzie, i18n, ESLint, Prettier, Jest, commitlint, hooki, CI, `ci:local`, Renovate, README, CLAUDE.md, docs; decyzja o koncie Apple | Pusta aplikacja z tokenami działa na iPhonie; CI zielone; `ci:local` zielone; ochrona main ustawiona |
| **F4 Dane i logika**           | Schemat SQLite, migracje, repozytoria, logika (1RM, objętość, rekordy, podpowiedź), lista ćwiczeń i programów                                                                                     | Testy logiki przechodzą; migracje testowane; lista ćwiczeń zaakceptowana                             |
| **F5 Ćwiczenia i plany**       | Ekrany bazy ćwiczeń (z zastępnikami ilustracji), własne ćwiczenia, plany i edycja dni, gotowe programy                                                                                            | Ścieżki przechodzą na urządzeniu; VoiceOver i Dynamic Type sprawdzone                                |
| **F6 Trening w toku**          | Ekran treningu, serie, minutnik, podpowiedź, podsumowanie, odporność na zamknięcie aplikacji                                                                                                      | Pełny trening zapisany od początku do końca; dane przetrwają zamknięcie aplikacji                    |
| **F7 Historia i postępy**      | Historia, edycja treningu, wykresy, rekordy, masa ciała, konfiguracja widoku                                                                                                                      | Wykresy zgodne z danymi testowymi; płynne przewijanie na długiej historii                            |
| **F8 Onboarding i ustawienia** | Pierwsze uruchomienie, ustawienia, eksport, import, usuń wszystko                                                                                                                                 | Eksport → usuń → import przywraca dane 1:1                                                           |
| **F9 Ilustracje i animacje**   | Ilustracje ćwiczeń w jednym stylu, animacje z obsługą Reduce Motion                                                                                                                               | Wszystkie ćwiczenia z ilustracją; licencje udokumentowane                                            |
| **F10 Dopracowanie**           | Przegląd całości: błędy, dostępność, wydajność, przypadki brzegowe, ikona, ekran startowy, nazwa                                                                                                  | Lista z przeglądu zamknięta; brak błędów krytycznych                                                 |
| **F11 Publikacja**             | Konto Apple, polityka prywatności, etykiety, TestFlight, App Store, wpis w portfolio                                                                                                              | Aplikacja w TestFlight / App Store; wpis w portfolio                                                 |

## 11. Otwarte sprawy (TODO)

- TODO(content): nazwa aplikacji.
- TODO(content): aplikacje-wzory od Jakuba (do F1 i do gotowych programów).
- Dane serii poza ciężarem i powtórzeniami (RPE / RIR, typy serii): w modelu jest miejsce, decyzja po MVP.
- Styl i sposób wykonania ilustracji: F9.
- Konto Apple Developer: przed F3.
