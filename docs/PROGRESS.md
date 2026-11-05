# Postęp

Fazy z `docs/PLAN.md`. Jedna faza = jedna gałąź = jeden PR.

| Faza                | Stan                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| F0 Specyfikacja     | zrobione (`docs/PLAN.md`)                                                |
| F1 Kierunek wyglądu | zrobione (wybrany kierunek B · Szkło, makiety w `design/f1`)             |
| F2 Design system    | zrobione (`design/tokens.json`, `docs/DESIGN.md`, makiety w `design/f2`) |
| F3 Fundament        | w PR: `feat/f3-fundament`                                                |

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
- Warunki licencji SF Symbols: potwierdzić przed publikacją (F11).
