// Wspólne dla testów ekranów z bazą: prawdziwy SQLite w pamięci i opakowanie w motyw.
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Db } from '@/data/db';
import { migrate } from '@/data/migrations';
import { seedBuiltinData } from '@/data/seed/seed';
import { createTestDb } from '@/data/testing/nodeDb';
import { ThemeProvider } from '@/theme';

export async function seededDb(): Promise<Db> {
  const db = createTestDb();
  await migrate(db);
  await seedBuiltinData(db);
  return db;
}

export function renderWithTheme(ui: ReactElement) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );
}
