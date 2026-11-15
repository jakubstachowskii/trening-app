// Najczęściej wykonywane ćwiczenia na siłowni. W wynikach wyszukiwania idą przed resztą
// (np. „wyciskanie” → najpierw wyciskanie na ławce, nie wyciskanie Arnolda). Kolejność ma znaczenie.
export const POPULAR_EXERCISE_IDS: readonly string[] = [
  'bench-press',
  'back-squat',
  'deadlift',
  'overhead-press',
  'barbell-row',
  'pull-up',
  'lat-pulldown',
  'incline-bench-press',
  'dumbbell-bench-press',
  'incline-dumbbell-press',
  'romanian-deadlift',
  'leg-press',
  'hip-thrust',
  'dip',
  'chin-up',
  'dumbbell-shoulder-press',
  'lateral-raise',
  'barbell-curl',
  'dumbbell-curl',
  'triceps-pushdown',
  'seated-cable-row',
  'dumbbell-row',
  'leg-extension',
  'lying-leg-curl',
  'bulgarian-split-squat',
  'push-up',
  'plank',
  'standing-calf-raise',
  'hanging-leg-raise',
  'face-pull',
  'crunch',
];

const rank = new Map(POPULAR_EXERCISE_IDS.map((id, index) => [id, index]));

/** Miejsce na liście popularnych (0 = najpopularniejsze); pozostałe za nimi. */
export function popularityRank(id: string): number {
  return rank.get(id) ?? POPULAR_EXERCISE_IDS.length;
}
