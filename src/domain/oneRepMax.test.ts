import { estimateOneRepMax, isReliableEstimate } from './oneRepMax';

describe('estimateOneRepMax', () => {
  it('przy 1 powtórzeniu zwraca sam ciężar (oba wzory)', () => {
    expect(estimateOneRepMax(100, 1, 'epley')).toBe(100);
    expect(estimateOneRepMax(100, 1, 'brzycki')).toBe(100);
  });

  it('liczy wzorem Epleya: ciężar × (1 + powtórzenia / 30)', () => {
    expect(estimateOneRepMax(100, 5, 'epley')).toBeCloseTo(116.67, 2);
    expect(estimateOneRepMax(80, 10, 'epley')).toBeCloseTo(106.67, 2);
  });

  it('liczy wzorem Brzyckiego: ciężar × 36 / (37 − powtórzenia)', () => {
    expect(estimateOneRepMax(100, 5, 'brzycki')).toBeCloseTo(112.5, 2);
    expect(estimateOneRepMax(80, 10, 'brzycki')).toBeCloseTo(106.67, 2);
  });

  it('domyślnie używa wzoru Epleya', () => {
    expect(estimateOneRepMax(100, 5)).toBe(estimateOneRepMax(100, 5, 'epley'));
  });

  it('nie zgaduje przy braku danych, zerze lub wartościach ujemnych', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(-20, 5)).toBeNull();
    expect(estimateOneRepMax(100, -1)).toBeNull();
    expect(estimateOneRepMax(Number.NaN, 5)).toBeNull();
  });

  it('Brzycki nie działa od 37 powtórzeń (dzielenie przez zero)', () => {
    expect(estimateOneRepMax(20, 37, 'brzycki')).toBeNull();
    expect(estimateOneRepMax(20, 40, 'brzycki')).toBeNull();
  });

  it('zaokrągla powtórzenia ułamkowe w dół', () => {
    expect(estimateOneRepMax(100, 5.7)).toBe(estimateOneRepMax(100, 5));
  });
});

describe('isReliableEstimate', () => {
  it('uznaje szacunek za wiarygodny do 12 powtórzeń', () => {
    expect(isReliableEstimate(1)).toBe(true);
    expect(isReliableEstimate(12)).toBe(true);
    expect(isReliableEstimate(13)).toBe(false);
  });
});
