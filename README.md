# Training App

Aplikacja na iPhone'a do treningu siłowego: plany, zapis serii, powtórzeń i ciężaru, postępy na wykresach i baza ćwiczeń.

Stan: fundament (faza F3). Szczegóły w [docs/PROGRESS.md](docs/PROGRESS.md).

## Stack

- Expo SDK 57, React Native, TypeScript (strict)
- Expo Router z systemowym paskiem kart iOS
- Design system w [design/tokens.json](design/tokens.json), zasady w [docs/DESIGN.md](docs/DESIGN.md)
- Jest + React Native Testing Library, ESLint, Prettier, GitHub Actions

## Uruchomienie

Wymagane: Node 24 i pnpm (przez Corepack).

```bash
pnpm install
pnpm start
```

Na iPhonie: zainstaluj **Expo Go** z App Store i zeskanuj aparatem kod QR z terminala (telefon i komputer w tej samej sieci Wi-Fi).

Podgląd w przeglądarce (przybliżenie, nie iOS): `pnpm web`.

## Skrypty

| Skrypt                     | Co robi                                                |
| -------------------------- | ------------------------------------------------------ |
| `pnpm lint`                | ESLint i sprawdzenie formatowania                      |
| `pnpm typecheck`           | TypeScript bez budowania                               |
| `pnpm test`                | testy                                                  |
| `pnpm contrast`            | kontrast wszystkich akcentów w obu motywach            |
| `pnpm check:expo`          | expo-doctor: zgodność projektu z SDK                   |
| `pnpm check:expo-versions` | nowsze poprawki paczek Expo (tylko informacja)         |
| `pnpm export:ios`          | próbne zbudowanie paczki iOS                           |
| `pnpm ci:local`            | wszystkie kroki CI na czystej kopii ostatniego commitu |

## Dokumentacja

- [docs/PLAN.md](docs/PLAN.md): specyfikacja i fazy
- [docs/DESIGN.md](docs/DESIGN.md): design system
- [docs/DECISIONS.md](docs/DECISIONS.md): decyzje i zależności
- [docs/PROGRESS.md](docs/PROGRESS.md): postęp
