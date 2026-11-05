import { roundToStep } from './units';

describe('roundToStep', () => {
  it('zaokrągla do najbliższego kroku', () => {
    expect(roundToStep(61.3, 2.5)).toBe(62.5);
    expect(roundToStep(61.2, 2.5)).toBe(60);
    expect(roundToStep(23.1, 1)).toBe(23);
  });

  it('nie wprowadza błędów zmiennoprzecinkowych', () => {
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(102.49999, 1.25)).toBe(102.5);
  });

  it('przy niepoprawnym kroku zwraca wartość bez zmian', () => {
    expect(roundToStep(61.3, 0)).toBe(61.3);
    expect(roundToStep(61.3, -2.5)).toBe(61.3);
  });
});
