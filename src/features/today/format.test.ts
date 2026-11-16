import { dayInitial, formatNext, formatWhen } from './format';

const NOW = new Date(2026, 10, 19, 18, 0); // czwartek

describe('daty na ekranie „Dziś”', () => {
  it('litery dni tygodnia', () => {
    expect(dayInitial(new Date(2026, 10, 16))).toBe('P');
    expect(dayInitial(new Date(2026, 10, 18))).toBe('Ś');
    expect(dayInitial(new Date(2026, 10, 22))).toBe('N');
  });

  it('kiedy: dziś, wczoraj, dzień tygodnia, potem data', () => {
    expect(formatWhen(new Date(2026, 10, 19, 8).toISOString(), NOW)).toBe('dziś');
    expect(formatWhen(new Date(2026, 10, 18, 20).toISOString(), NOW)).toBe('wczoraj');
    expect(formatWhen(new Date(2026, 10, 16, 9).toISOString(), NOW)).toBe('w poniedziałek');
    expect(formatWhen(new Date(2026, 10, 17, 9).toISOString(), NOW)).toBe('we wtorek');
    expect(formatWhen(new Date(2026, 10, 10, 9).toISOString(), NOW)).toMatch(/10/);
  });
});

it('następny dzień treningowy: jutro, dzień tygodnia', () => {
  expect(formatNext(new Date(2026, 10, 20).toISOString(), NOW)).toBe('jutro');
  expect(formatNext(new Date(2026, 10, 23).toISOString(), NOW)).toBe('w poniedziałek');
});
