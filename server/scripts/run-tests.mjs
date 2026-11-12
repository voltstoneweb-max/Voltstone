// Lanza node --test con los archivos de cada grupo. Funciona igual en Node 20 y 22, en Windows, Mac y Linux
// (Node 22 ya no acepta carpetas como argumento y Node 20 no entiende comodines).
// Uso: node scripts/run-tests.mjs unit [--coverage]   |   node scripts/run-tests.mjs integration
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const [group, ...flags] = process.argv.slice(2);
const list = (dir) => readdirSync(dir).filter((f) => /\.test\.m?js$/.test(f)).sort().map((f) => join(dir, f));
const groups = {
  unit: list('tests/unit'),
  integration: [join('tests', 'api.test.mjs'), ...list('tests/integration')]
};
if (!groups[group]) { console.error('Uso: run-tests.mjs unit|integration [--coverage]'); process.exit(2); }

const args = ['--test', '--test-concurrency=1'];
if (flags.includes('--coverage')) args.push('--experimental-test-coverage');
const r = spawnSync(process.execPath, [...args, ...groups[group]], { stdio: 'inherit' });
process.exit(r.status ?? 1);
