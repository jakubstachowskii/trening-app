# CLAUDE.md

Zasady pracy w tym repozytorium.

## Projekt

Aplikacja iOS do treningu siłowego (Expo SDK 57, React Native, TypeScript strict, Expo Router). Specyfikacja: `docs/PLAN.md`. Design system: `docs/DESIGN.md` i `design/tokens.json`.

## Proces

- Jedna faza z `docs/PLAN.md` = jedna gałąź = jeden PR. PR otwiera i merguje właściciel repozytorium.
- Przed każdym pushem: commit, potem `pnpm ci:local` (te same kroki co CI, na czystej kopii commitu). Push tylko na zielono.
- Conventional Commits (commitlint), małe, atomowe commity.
- Sekretów nigdy nie commitujemy.

## Kod

- Kolory, odstępy, promienie, rozmiary i czasy animacji tylko z tokenów (`useTheme()` z `@/theme`). ESLint blokuje literały kolorów w `src/`.
- Teksty interfejsu tylko w `src/i18n/locales/pl.json`, przez `t()`.
- Logika poza komponentami, małe komponenty. Logika danych i obliczeń postępów zawsze z testami.
- Dostępność: etykiety i nagłówki dla VoiceOver, Dynamic Type, kontrast z `pnpm contrast`, cele dotyku min. 44 pt, jasny i ciemny motyw, Ogranicz ruch.
- Przed użyciem API sprawdzić aktualną dokumentację Expo dla SDK 57. Rozbieżności z planem i każdą nową zależność opisać w `docs/DECISIONS.md`.
- Pliki w `src/app/` to trasy. Testy ekranów trzymamy w `src/__tests__/`.
- Wygląd zatwierdzony w `design/f2` zmieniamy tylko za zgodą właściciela.
