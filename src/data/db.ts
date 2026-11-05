// Cienka warstwa nad SQLite (docs/DECISIONS.md #11). W aplikacji: expo-sqlite, w testach: node:sqlite.
// Wszystkie zapytania idą przez jedną kolejkę, więc transakcje nie przeplatają się z innymi zapytaniami
// (withTransactionAsync z expo-sqlite nie jest wyłączna).

export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

/** Minimalny sterownik: implementacje w expoDb.ts i testing/nodeDb.ts. */
export type SqlDriver = {
  exec(sql: string): Promise<void>;
  run(sql: string, params: SqlParams): Promise<{ changes: number }>;
  all<T>(sql: string, params: SqlParams): Promise<T[]>;
  first<T>(sql: string, params: SqlParams): Promise<T | null>;
};

export type Db = {
  /** Kilka poleceń naraz, bez parametrów. Tylko dla stałego SQL (migracje), nigdy dla danych. */
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlParams): Promise<{ changes: number }>;
  all<T>(sql: string, params?: SqlParams): Promise<T[]>;
  first<T>(sql: string, params?: SqlParams): Promise<T | null>;
  /** Wszystko albo nic. Wewnątrz używaj tylko przekazanego `tx`. */
  transaction<T>(work: (tx: Db) => Promise<T>): Promise<T>;
};

function direct(driver: SqlDriver): Db {
  const tx: Db = {
    exec: (sql) => driver.exec(sql),
    run: (sql, params = []) => driver.run(sql, params),
    all: (sql, params = []) => driver.all(sql, params),
    first: (sql, params = []) => driver.first(sql, params),
    // Zagnieżdżona transakcja jest częścią zewnętrznej.
    transaction: (work) => work(tx),
  };
  return tx;
}

export function createDb(driver: SqlDriver): Db {
  let queue: Promise<unknown> = Promise.resolve();
  const inner = direct(driver);

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task, task);
    queue = result.catch(() => undefined);
    return result;
  }

  return {
    exec: (sql) => enqueue(() => inner.exec(sql)),
    run: (sql, params) => enqueue(() => inner.run(sql, params)),
    all: (sql, params) => enqueue(() => inner.all(sql, params)),
    first: (sql, params) => enqueue(() => inner.first(sql, params)),
    transaction: (work) =>
      enqueue(async () => {
        await driver.exec('BEGIN');
        try {
          const value = await work(inner);
          await driver.exec('COMMIT');
          return value;
        } catch (error) {
          await driver.exec('ROLLBACK');
          throw error;
        }
      }),
  };
}

/** SQLite nie ma typu logicznego: 0/1. */
export const toFlag = (value: boolean): number => (value ? 1 : 0);
export const fromFlag = (value: number | null | undefined): boolean => value === 1;
