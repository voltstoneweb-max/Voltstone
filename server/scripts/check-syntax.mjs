// "Lint" sin dependencias: revisa la sintaxis de todos los .js/.mjs del servidor (node --check).
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(name)) files.push(p);
  }
};
['src', 'tests', 'scripts'].forEach(walk);

let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { bad++; console.error(`✗ ${f}\n${e.stderr}`); }
}
console.log(bad ? `${bad} archivo(s) con errores` : `✓ ${files.length} archivos sin errores de sintaxis`);
process.exit(bad ? 1 : 0);
