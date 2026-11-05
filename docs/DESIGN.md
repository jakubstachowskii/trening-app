# Design system: Training App

Status: **wersja robocza F2** (2026-11-03, po 10 czystych przebiegach przeglądu z rzędu), czeka na akceptację. Kierunek: **B · Szkło** (zatwierdzony w F1).

Źródło prawdy dla wartości: [`design/tokens.json`](../design/tokens.json). Ten dokument opisuje zasady. Liczby są tylko w tokenach.

## 1. Zasady

1. **Natywnie dla iOS.** Czcionka systemowa, skala tekstu iOS, Liquid Glass na elementach, które unoszą się nad treścią.
2. **Treść jest najważniejsza.** Karty mają spokojne tło, a akcent (domyślnie niebieski) pojawia się tylko tam, gdzie jest działanie albo wynik: przycisk główny, zrobiona seria, linia wykresu, rekord.
3. **Zero magicznych wartości.** Kolor, odstęp, promień, czas animacji i rozmiar zawsze pochodzą z tokenów.
4. **Ruch to informacja zwrotna, a nie ozdoba.** Każda animacja ma powód (potwierdzenie, przejście, zmiana danych) i wersję dla Reduce Motion.
5. **Dostępność od początku:** VoiceOver, Dynamic Type, kontrast, cele dotyku co najmniej 44 pt, jasny i ciemny motyw.

## 2. Kolory

- Kolory są semantyczne: `bg`, `surface`, `raised`, `fill`, `selected`, `label`, `label2`, `label3`, `separator`, `onAccent`, `success`, `warning`, `danger`, plus kolory szkła i cienia.
- **Ciemny motyw stoi na czystej czerni** (`bg` #000000; decyzja z F2): najgłębsza czerń na ekranach OLED i zgodność z ciemnym motywem iOS.
- **Akcent wybiera użytkownik** w ustawieniach spośród 5 gotowych (`color.accents`): niebieski (domyślny), indygo, pomarańcz, malina, zieleń. Każdy ma `accent`, `accentText` i `accentSoft` dla obu motywów, sprawdzone pod kontrast. Dowolnego koloru nie dajemy, bo nie da się zagwarantować czytelności.
- Akcent nie oznacza ostrzeżenia ani usuwania. Dlatego np. „Zakończ” w treningu jest neutralne (`label`), a `danger` pojawia się dopiero przy potwierdzeniu usunięcia. Przy akcencie „zieleń” kolor sukcesu jest zbliżony do akcentu, co jest akceptowalne, bo oba oznaczają coś pozytywnego.
- `accent` służy do wypełnień. Na tekst i ikony w kolorze akcentu używamy `accentText`, który ma lepszy kontrast.
- `label3` jest tylko dla elementów wyłączonych i dekoracji, nigdy dla tekstu, który trzeba przeczytać.
- **Kontrast** sprawdza skrypt `node design/check-contrast.js design/tokens.json`. Progi: tekst 4,5:1, grafika i duży tekst 3:1. Skrypt sprawdza każdy akcent w obu motywach. Wynik z 2026-11-03: wszystkie pary zaliczone.
- Mapa treningów ma niższe poziomy intensywności poniżej 3:1, bo stopniowanie z natury jest delikatne. Ta sama informacja jest podana tekstem („32 treningi”) i w etykiecie VoiceOver.

## 3. Typografia

- Skala iOS: Large Title, Title 1–3, Headline, Body, Callout, Subheadline, Footnote, Caption 1–2. Do tego dwa style liczbowe: `metric` i `timer`.
- Każdy styl jest powiązany ze stylem Dynamic Type i rośnie razem z ustawieniem użytkownika. Przy dużym tekście wiersze się zawijają, a układy w dwóch kolumnach przechodzą w jedną.
- Wszystkie liczby (ciężar, powtórzenia, czas, wyniki) mają cyfry o stałej szerokości (`tabular-nums`), żeby kolumny stały równo.

## 4. Odstępy, promienie, rozmiary

- Siatka 4 pt: `xxs 4`, `xs 8`, `sm 12`, `md 16`, `lg 20`, `xl 24`, `xxl 32`, `xxxl 40`.
- Margines ekranu 20 (16 na ekranie treningu, gdzie liczy się szerokość tabeli), wnętrze karty 16, odstęp między sekcjami 24, między elementami 12.
- **Promienie koncentryczne:** promień wewnętrzny = promień zewnętrzny − wcięcie. Karta 28 z wcięciem 16 daje 12 dla elementów w środku. Segment przełącznika ma 10 (12 − 2). Przyciski i pigułki mają kształt kapsuły. Wykresy i mapa treningów: `data` 4. Wyjątki poza siatką to tylko obramowania (1 pt) i wcięcie segmentu (2 pt).
- Cele dotyku co najmniej 44 × 44 pt. Przycisk główny ma 52 pt wysokości.

## 5. Szkło i głębia

- **Dwa poziomy szkła:**
  - `bar`: pasek kart, pływający nad treścią,
  - `control`: przyciski w nagłówku, minutnik przerwy, przełącznik ćwiczenia.
- W aplikacji szkło da `expo-glass-effect` (iOS 26+; na starszych systemach zwykły widok). Dokładne API sprawdzę w dokumentacji w F3.
- **Reduce Transparency:** gdy użytkownik ograniczy przezroczystość w iOS, szkło zmienia się w pełne tło `raised` z obramowaniem `separator`.
- Cień `shadowFloating` mają tylko elementy nad treścią: pływający przycisk, minutnik, komunikat.
- **Wygaszanie krawędzi przewijania** (jak w iOS 26): przy górnej i dolnej krawędzi ekranu treść łagodnie przechodzi w tło, żeby nie mieszała się z pływającymi przyciskami i paskiem kart.

## 6. Komponenty

| Komponent              | Zasady                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Przycisk główny        | kapsuła, 52 pt, `accent` / `onAccent`, na ekranach szczegółów pływa nad treścią z cieniem (bez panelu pod spodem)        |
| Przycisk drugorzędny   | kapsuła, 44 pt, `fill` / `label`                                                                                         |
| Przycisk tekstowy      | `accentText`, bez tła, min. 44 pt                                                                                        |
| Przycisk ikony         | 44 × 44, szkło `control`, zawsze z etykietą dla VoiceOver                                                                |
| Pigułka                | 32 pt, `fill`; wyróżniona: `accentSoft` / `accentText`                                                                   |
| Przełącznik segmentowy | tło `fill`, wybrany segment `selected` z lekkim cieniem, segment min. 44 pt                                              |
| Wiersz serii           | seria, poprzednio, kg, powt., odhaczenie 44 pt; zrobiona: tło `accentSoft`, odhaczenie `accent`                          |
| Minutnik przerwy       | szkło `control`, pierścień postępu, −15 s / +15 s / Pomiń                                                                |
| Komunikat (rekord)     | `accent` / `onAccent`, promień `card`, u góry ekranu, zakrywa cały nagłówek, znika po ok. 3 s, ogłaszany przez VoiceOver |
| Pasek kart             | szkło `bar`, pływający, 5 kart, aktywna w `accentText`                                                                   |
| Kafelek z liczbą       | `surface`, etykieta Footnote, wartość `metric`                                                                           |
| Wiersz listy           | min. 64 pt, miniatura 40 pt, strzałka                                                                                    |
| Pusty stan             | tytuł, jedno zdanie, jedno działanie                                                                                     |
| Ładowanie              | szkielet z `fill`, pulsuje; przy Reduce Motion stały                                                                     |

## 7. Ruch i haptyka

- Czasy: `fast 150`, `base 250`, `slow 400`, rysowanie wykresu `chart 900`, tyknięcie minutnika `tick 1000`, pętle: szkielet ładowania `loop 1400`, zastępcza ilustracja `illustrationLoop 2400` ms. Krzywa `standard`.
- Sprężyny: `gentle` (przejścia, wjazd minutnika) i `bouncy` (odhaczenie serii, komunikat rekordu). W aplikacji przez Reanimated, a na makietach jako przybliżenie krzywą CSS.
- Naciśnięcie: skala 0,97.
- **Reduce Motion:** przesunięcia, skale i sprężyny zastępuje zanikanie 150 ms, a wykres pojawia się bez rysowania.
- Wibracje: wybór (zakładki, przełączniki), lekkie uderzenie przy odhaczeniu serii, „sukces” przy rekordzie. API `expo-haptics` sprawdzę w F3.

## 8. Ikony

Docelowo SF Symbols (`expo-symbols`). Przed użyciem w F3 sprawdzę warunki Apple dotyczące symboli. Do tego czasu makiety używają prostych ikon liniowych.

## 9. Teksty

Proste i naturalne, po polsku, bez marketingowego tonu. Wszystkie teksty interfejsu w plikach tłumaczeń (od F3).

## 10. Otwarte

- Ilustracje ćwiczeń: faza F10.
