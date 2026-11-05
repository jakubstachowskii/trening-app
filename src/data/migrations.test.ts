import { createDb } from './db';
import { LATEST_VERSION, migrate } from './migrations';
import { createTestDb } from './testing/nodeDb';

const TABLES = [
  'bodyweight_entry',
  'exercise',
  'plan',
  'plan_day',
  'plan_exercise',
  'schema_migration',
  'setting',
  'workout',
  'workout_exercise',
  'workout_set',
];

describe('migrate', () => {
  it('pusta baza → najnowsza wersja ze wszystkimi tabelami', async () => {
    const db = createTestDb();
    expect(await migrate(db)).toEqual({ from: 0, to: LATEST_VERSION });

    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(TABLES);
    expect(await db.first('PRAGMA user_version')).toEqual({ user_version: LATEST_VERSION });
    expect(await db.all('SELECT version FROM schema_migration')).toEqual([{ version: 1 }]);
  });

  it('ponowne uruchomienie niczego nie zmienia', async () => {
    const db = createTestDb();
    await migrate(db);
    expect(await migrate(db)).toEqual({ from: LATEST_VERSION, to: LATEST_VERSION });
    expect(await db.all('SELECT version FROM schema_migration')).toHaveLength(LATEST_VERSION);
  });

  it('włącza klucze obce', async () => {
    const db = createTestDb();
    await migrate(db);
    expect(await db.first('PRAGMA foreign_keys')).toEqual({ foreign_keys: 1 });
    await expect(
      db.run(
        "INSERT INTO plan_day (id, plan_id, name, position) VALUES ('d', 'nie-ma-planu', 'A', 0)",
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('odmawia pracy na bazie z nowszej wersji aplikacji', async () => {
    const db = createTestDb();
    await db.exec(`PRAGMA user_version = ${LATEST_VERSION + 1}`);
    await expect(migrate(db)).rejects.toThrow(/wersję/);
  });

  it('błąd w migracji cofa całą migrację', async () => {
    const db = createTestDb();
    await db.exec('CREATE TABLE exercise (id TEXT)'); // konflikt z migracją 1
    await expect(migrate(db)).rejects.toThrow();
    expect(await db.first('PRAGMA user_version')).toEqual({ user_version: 0 });
    expect(await db.first("SELECT name FROM sqlite_master WHERE name = 'plan'")).toBeNull();
  });
});

describe('createDb', () => {
  it('kolejkuje zapytania: transakcja nie miesza się z innymi zapytaniami', async () => {
    const log: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const db = createDb({
      exec: async (sql) => {
        log.push(sql);
      },
      run: async (sql) => {
        log.push(sql);
        return { changes: 1 };
      },
      all: async () => [],
      first: async () => null,
    });

    const tx = db.transaction(async (t) => {
      await t.run('A');
      await gate;
      await t.run('B');
    });
    const outside = db.run('OUTSIDE');
    release();
    await Promise.all([tx, outside]);
    expect(log).toEqual(['BEGIN', 'A', 'B', 'COMMIT', 'OUTSIDE']);
  });

  it('po błędzie robi ROLLBACK i kolejka działa dalej', async () => {
    const db = createTestDb();
    await db.exec('CREATE TABLE t (v INTEGER)');
    await expect(
      db.transaction(async (tx) => {
        await tx.run('INSERT INTO t VALUES (1)');
        throw new Error('przerwane');
      }),
    ).rejects.toThrow('przerwane');
    expect(await db.all('SELECT * FROM t')).toEqual([]);
    await db.run('INSERT INTO t VALUES (2)');
    expect(await db.all('SELECT * FROM t')).toEqual([{ v: 2 }]);
  });
});
