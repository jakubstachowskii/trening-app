// Prawdziwy SQLite w pamięci dla testów (wbudowany w Node 22+, bez dodatkowych zależności).
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { createDb, type Db } from '../db';

export function createTestDb(): Db {
  const database = new DatabaseSync(':memory:');
  const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

  return createDb({
    exec: async (sql) => {
      database.exec(sql);
    },
    run: async (sql, params) => {
      const { changes } = database.prepare(sql).run(...(params as SQLInputValue[]));
      return { changes: Number(changes) };
    },
    all: async (sql, params) =>
      database
        .prepare(sql)
        .all(...(params as SQLInputValue[]))
        .map((row) => plain(row)),
    first: async (sql, params) => {
      const row = database.prepare(sql).get(...(params as SQLInputValue[]));
      return row === undefined ? null : plain(row);
    },
  });
}
