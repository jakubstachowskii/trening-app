// Szacowany czas dnia planu („ok. 55 min”) do karty na ekranie „Dziś”.
import { DEFAULT_REST_SEC } from './restTimer';

/** Przeciętny czas jednej serii (wykonanie + odłożenie sprzętu). */
export const AVERAGE_SET_SEC = 45;
const ROUND_TO_MIN = 5;

export type EstimateExercise = {
  targetSets: number;
  restSec: number | null;
  targetDurationSec?: number | null;
};

/** Minuty zaokrąglone do 5 (co najmniej 5). Pusty dzień = 0. */
export function estimateDayMinutes(exercises: EstimateExercise[]): number {
  let sec = 0;
  for (const e of exercises) {
    const sets = Math.max(0, e.targetSets);
    const work = e.targetDurationSec ?? AVERAGE_SET_SEC;
    sec += sets * (work + (e.restSec ?? DEFAULT_REST_SEC));
  }
  if (sec === 0) return 0;
  return Math.max(ROUND_TO_MIN, Math.round(sec / 60 / ROUND_TO_MIN) * ROUND_TO_MIN);
}
