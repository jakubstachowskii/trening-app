import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilitySettings } from './useAccessibilitySettings';

afterEach(() => jest.restoreAllMocks());

describe('useAccessibilitySettings', () => {
  it('odczytuje Ogranicz ruch i Zmniejsz przezroczystość z systemu', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useAccessibilitySettings());
    expect(result.current).toEqual({ reduceMotion: true, reduceTransparency: true });
  });

  it('reaguje na zmianę ustawienia w trakcie działania aplikacji', async () => {
    const listeners: Record<string, (value: boolean) => void> = {};
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      event: string,
      handler: (value: boolean) => void,
    ) => {
      listeners[event] = handler;
      return { remove: jest.fn() };
    }) as never);
    const { result } = await renderHook(() => useAccessibilitySettings());
    await act(() => listeners.reduceMotionChanged(true));
    expect(result.current.reduceMotion).toBe(true);
  });

  it('gdy platforma nie ma funkcji odczytu, zostaje false bez błędu', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockImplementation(() => {
      throw new TypeError('not a function');
    });
    const { result } = await renderHook(() => useAccessibilitySettings());
    expect(result.current.reduceTransparency).toBe(false);
  });
});
