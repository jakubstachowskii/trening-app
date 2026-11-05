// Lokalna kopia CI (.github/workflows/ci.yml): te same kroki, w tej samej kolejności, z CI=true,
// na czystej kopii OSTATNIEGO COMMITU (git worktree) — bez node_modules, dist/ i niezacommitowanych plików.
// Uruchamiać przed każdym pushem: `pnpm ci:local`.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const steps = [
  ['install', 'pnpm install --frozen-lockfile'],
  ['lint', 'pnpm lint'],
  ['typecheck', 'pnpm typecheck'],
  ['test', 'pnpm test'],
  ['contrast', 'pnpm contrast'],
  ['expo-doctor', 'pnpm check:expo'],
  ['expo-versions', 'pnpm check:expo-versions', { optional: true }],
  ['export-ios', 'pnpm export:ios'],
];

const run = (cmd, cwd, quiet = false) =>
  spawnSync(cmd, {
    cwd,
    shell: true,
    stdio: quiet ? 'pipe' : 'inherit',
    env: {
      ...process.env,
      CI: 'true',
      FORCE_COLOR: '1',
      // jak w ci.yml: wersje poprawkowe sprawdza osobny krok (docs/DECISIONS.md #10)
      EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK: '1',
    },
  });

const dirty = run('git status --porcelain', process.cwd(), true).stdout.toString().trim();
if (dirty) {
  console.warn('⚠ Niezacommitowane zmiany NIE są sprawdzane (CI widzi tylko commit):\n' + dirty);
}

const dir = mkdtempSync(join(tmpdir(), 'trening-app-ci-'));
const results = [];
let failed = null;
try {
  if (run(`git worktree add --detach "${dir}" HEAD`, process.cwd(), true).status !== 0) {
    throw new Error('git worktree add nie powiódł się');
  }
  for (const [name, cmd, { optional = false } = {}] of steps) {
    console.log(`\n━━━ ${name}: ${cmd}`);
    const t0 = Date.now();
    const { status } = run(cmd, dir);
    const s = ((Date.now() - t0) / 1000).toFixed(0);
    const mark = status === 0 ? '✔' : optional ? '⚠' : '✘';
    results.push(
      `${mark} ${name.padEnd(13)} ${s}s${status !== 0 && optional ? ' (tylko ostrzeżenie)' : ''}`,
    );
    if (status !== 0 && !optional) {
      failed = name;
      break;
    }
  }
} finally {
  run(`git worktree remove --force "${dir}"`, process.cwd(), true);
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n━━━ ci:local (${results.length}/${steps.length} kroków)\n${results.join('\n')}`);
if (failed) {
  console.error(`\n✘ Pada krok „${failed}” — CI na GitHubie też padnie.`);
  process.exit(1);
}
console.log('\n✔ Wszystkie kroki CI przechodzą na czystej kopii commitu.');
