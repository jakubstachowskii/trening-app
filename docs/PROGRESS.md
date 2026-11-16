# Postęp

Fazy z `docs/PLAN.md`. Jedna faza = jedna gałąź = jeden PR.

| Faza                 | Stan                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| F0 Specyfikacja      | zrobione (`docs/PLAN.md`)                                                |
| F1 Kierunek wyglądu  | zrobione (wybrany kierunek B · Szkło, makiety w `design/f1`)             |
| F2 Design system     | zrobione (`design/tokens.json`, `docs/DESIGN.md`, makiety w `design/f2`) |
| F3 Fundament         | zrobione (PR #1)                                                         |
| F4 Dane i logika     | zrobione (PR #4)                                                         |
| F5 Ćwiczenia i plany | zrobione (PR #5)                                                         |
| F6 Trening w toku    | w PR: `feat/f6-trening`                                                  |

## F6 Trening w toku

Zrobione:

- **Start**: karta „Następny trening” (kolejny dzień aktywnego planu po ostatnio zrobionym), „Pusty trening”, karta „Trening w toku · Wznów”. Przy niedokończonym treningu pytanie „Wznów / Porzuć i zacznij nowy”.
- **Dzień planu**: pływający przycisk „Zacznij trening” („Dodaj ćwiczenie” pod listą).
- **Ekran treningu** (makieta F2-Trening): czas od startu, nazwa dnia, „Zakończ”, „Zwiń”; karta bieżącego ćwiczenia z podpowiedzią ciężaru i tabelą Seria / Poprzednio / kg / Powt. / odhaczenie; menu serii (rozgrzewka / robocza, usuń) i ćwiczenia (zamień, notatka, usuń); „Dodaj serię”, „Dodaj ćwiczenie”; lista „Następne”; stoper dla ćwiczeń na czas.
- **Klawiatura** w dolnym panelu; wpisana wartość przechodzi na kolejne serie.
- **Minutnik przerwy** z pierścieniem: start po odhaczeniu, −15 s / +15 s / Pomiń, „Dalej: seria 2 · 80 × 10”, wibracja i powiadomienie lokalne po końcu, przetrwa zamknięcie aplikacji.
- **Rekord** w trakcie: komunikat u góry + wibracja + ogłoszenie VoiceOver.
- **Podsumowanie**: czas, objętość, serie, ćwiczenia, nowe rekordy, notatka.
- Ekran nie gaśnie w trakcie treningu.
- Testy: logika treningu (wypełnianie serii, kolejność, minutnik, klawiatura, rekordy, podsumowanie), repozytoria na SQLite, migracja 1 → 2 z danymi, ekrany Start / trening / podsumowanie na bazie w pamięci.

**Nowy wygląd (projekt `design/v2`, zatwierdzony przez właściciela 2026-11-16, etap A):**

- Krój Archivo Expanded w tytułach i liczbach.
- Trening: jeden rząd nagłówka w szkle, pasek segmentów ćwiczeń, tabela z bieżącą serią w ramce, główny przycisk w dwóch liniach, przerwa jako szklany pasek z arkuszem (duży pierścień), rekord jako plakietka w wierszu, czas ćwiczeń wpisywany jak w minutniku (m:ss), stoper jako główny przycisk.
- „Dziś” zamiast Start: pierścień tygodnia, pasek dni, seria tygodni, ostatni rekord, cel tygodnia bez planu.
- Opcjonalne dni treningowe planu (ekran planu → „Dni w tygodniu”): segmenty pierścienia, dni zaplanowane w pasku, dzień wolny na „Dziś”.
- Podsumowanie: domykający się segment tygodnia, 3 liczby, rekordy, porównanie z poprzednim treningiem tego dnia planu, notatka po stuknięciu.

Odstępstwa od `design/v2`: kolory z tokenów F2 (makieta ma minimalnie inne szarości); Archivo Expanded ma szerokość 125% (makieta 120%); figurka mięśni w podsumowaniu i zębatka ustawień na „Dziś” w kolejnych etapach.

Do sprawdzenia na iPhonie: powiadomienie o końcu przerwy (zablokowany ekran, inna aplikacja), zamknięcie aplikacji w trakcie i wznowienie, szkło minutnika i klawiatury, gest zamykania wyłączony; krój Archivo (także przy największym tekście), pasek i arkusz przerwy, pulsowanie pierścienia i Ogranicz ruch, wpisywanie czasu m:ss.

## F5 Ćwiczenia i plany

Zrobione:

- Karta **Ćwiczenia**: lista 154 gotowych i własnych ćwiczeń w sekcjach alfabetycznych, systemowa wyszukiwarka (bez polskich znaków, słowa w dowolnej kolejności, inne odmiany słów, potoczne nazwy jak „płaska ławka” czy „bench”, główne mięśnie i sprzęt; najpierw najlepsze trafienia i popularne ćwiczenia), filtry (partia mięśni, sprzęt, typ, tylko moje, ukryte) w arkuszu, aktywne filtry jako pigułki do usunięcia.
- **Szczegóły ćwiczenia**: zastępnik ilustracji (do F10), mięśnie i sprzęt, kafelki „Szacowane 1RM” i „Ostatnio”, zakładki Opis / Historia / Rekordy, „Dodaj do planu” (wybór planu i dnia), ukrywanie ćwiczeń.
- Opisy wykonania i typowe błędy dla wszystkich 154 ćwiczeń (`exerciseGuides` w `pl.json`).
- **Własne ćwiczenie**: nazwa, typ, główne i pomocnicze mięśnie, sprzęt, notatka; dodawanie i edycja.
- Karta **Plany**: aktywny plan na górze, moje plany, 4 gotowe programy z podglądem i kopiowaniem (kolejna kopia tego samego programu dostaje numer, np. „(2)”).
- **Plan**: dni z liczbą ćwiczeń, zmiana kolejności przeciąganiem (i akcjami VoiceOver), ustawienie aktywnego, edycja, usuwanie.
- **Dzień**: zmiana nazwy, ćwiczenia z celem („4 × 6–10 · przerwa 2 min 30 s”), przeciąganie, dodawanie z listy ćwiczeń, arkusz serii (serie, powtórzenia albo czas, ciężar docelowy, przerwa, notatka).
- Teksty z odmianą liczebników (1 seria, 3 serie, 5 serii).
- Testy: logika wyszukiwania i podsumowań, edycja planów na prawdziwym SQLite, ekrany z bazą w pamięci.

Odstępstwa od makiety F2: na szczegółach ćwiczenia przycisk „Dodaj do planu” zamiast „Dodaj do treningu” (trening powstaje w F6); zastępnik ilustracji to ikona zamiast schematu (bez nowej zależności).

Do sprawdzenia na iPhonie: przeciąganie, wibracje, arkusze, VoiceOver i największy rozmiar tekstu.

## F4 Dane i logika

Zrobione:

- Obliczenia w `src/domain`: szacowane 1RM (Epley, Brzycki), objętość (także z masą ciała), rekordy i nowe rekordy w treningu, podpowiedź ciężaru (progresja podwójna), statystyki tygodnia, zakresy dat do wykresów.
- Baza `expo-sqlite`: warstwa `Db` z kolejką zapytań, migracje, repozytoria (ćwiczenia, plany, treningi z seriami, masa ciała, ustawienia).
- 154 gotowe ćwiczenia z polskimi nazwami, mięśniami i sprzętem oraz 4 gotowe programy (Całe ciało 3 dni, Góra / dół 4 dni, Push / Pull / Nogi, Siła 5×5).
- Baza zakłada się przy starcie aplikacji, zanim pokażą się ekrany.
- Testy na prawdziwym SQLite (`node:sqlite`): migracje, repozytoria, gotowe dane, pełna ścieżka „trening → rekordy → podpowiedź”.

Ekrany korzystające z bazy: F5–F8.

## F3 Fundament

Zrobione:

- Expo SDK 58, TypeScript strict, Expo Router z 5 kartami (Start, Plany, Ćwiczenia, Postępy, Historia) na systemowym pasku kart iOS.
- Motyw z `design/tokens.json`: jasny/ciemny według systemu, niebieski akcent domyślnie, odczyt Ogranicz ruch i Zmniejsz przezroczystość.
- Teksty w `src/i18n/locales/pl.json`.
- Komponenty `Screen`, `Text`, `Card` i puste ekrany kart.
- Lint, Prettier, testy (kontrast wszystkich akcentów, motyw, ustawienia dostępności, tłumaczenia, ekrany, `app.json`), hooki gita, CI, `pnpm ci:local`, Renovate.

Sprawdzone w podglądzie web: 5 ekranów w obu motywach, przełączanie kart, nagłówki dla czytników ekranu, brak błędów w konsoli.

Do sprawdzenia na iPhonie (Expo Go): systemowy pasek kart ze szkłem, wcięcia pod paskiem stanu i kart, Dynamic Type.

Otwarte:

- `TODO(content)`: nazwa aplikacji. Roboczo „Training App”.
- `TODO(content)`: ikona aplikacji. Na razie ikona z szablonu Expo.
- Warunki licencji SF Symbols: potwierdzić przed publikacją (F12).
