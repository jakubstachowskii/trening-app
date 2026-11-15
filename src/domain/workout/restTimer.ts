// Minutnik przerwy liczony od zapisanego znacznika końca: przeżywa wygaszenie ekranu i zamknięcie aplikacji.

export const DEFAULT_REST_SEC = 120;
export const REST_ADJUST_SEC = 15;
/** Najkrótsza i najdłuższa przerwa, jaką da się ustawić (±15 s). */
export const MAX_REST_SEC = 60 * 60;

export type RestTimerState = {
  /** Koniec przerwy, ms od 1970 (Date.now()). */
  endsAt: number;
  /** Długość przerwy do pierścienia; rośnie, gdy dodamy więcej czasu niż zostało. */
  totalSec: number;
  /** Seria, która uruchomiła minutnik. */
  setId: string;
};

export function startRest(totalSec: number, setId: string, now: number): RestTimerState {
  const sec = clampSec(totalSec);
  return { endsAt: now + sec * 1000, totalSec: sec, setId };
}

export function remainingSec(state: RestTimerState, now: number): number {
  return Math.max(0, Math.ceil((state.endsAt - now) / 1000));
}

export function isFinished(state: RestTimerState, now: number): boolean {
  return state.endsAt <= now;
}

/** Postęp pierścienia: 1 = pełna przerwa przed nami, 0 = koniec. */
export function ringProgress(state: RestTimerState, now: number): number {
  if (state.totalSec <= 0) return 0;
  return Math.min(1, Math.max(0, (state.endsAt - now) / (state.totalSec * 1000)));
}

/** −15 s / +15 s. Nie schodzi poniżej „teraz” i nie przekracza godziny. */
export function adjustRest(state: RestTimerState, deltaSec: number, now: number): RestTimerState {
  const left = Math.max(0, state.endsAt - now);
  const nextLeft = Math.min(MAX_REST_SEC * 1000, Math.max(0, left + deltaSec * 1000));
  return {
    ...state,
    endsAt: now + nextLeft,
    totalSec: Math.max(state.totalSec, Math.ceil(nextLeft / 1000)),
  };
}

function clampSec(sec: number): number {
  if (!Number.isFinite(sec)) return DEFAULT_REST_SEC;
  return Math.min(MAX_REST_SEC, Math.max(0, Math.round(sec)));
}

/** Stan zapisany w ustawieniach (JSON) — odrzuca uszkodzone wpisy. */
export function parseRestTimer(value: unknown): RestTimerState | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.endsAt !== 'number' ||
    typeof v.totalSec !== 'number' ||
    typeof v.setId !== 'string' ||
    !Number.isFinite(v.endsAt)
  ) {
    return null;
  }
  return { endsAt: v.endsAt, totalSec: v.totalSec, setId: v.setId };
}
