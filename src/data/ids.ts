import { randomUUID } from 'expo-crypto';

/** Identyfikator danych użytkownika. Gotowe ćwiczenia mają stałe, czytelne id (seed/exercises.ts). */
export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
