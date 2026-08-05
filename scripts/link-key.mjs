/**
 * One-off helper: copy an existing ANTHROPIC_API_KEY from another local project
 * into this project's .env.local, without printing the key.
 *
 *   node scripts/link-key.mjs <path-to-source-env-file>
 *
 * Delete this once you've issued a dedicated key for this project.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const source = process.argv[2];
if (!source || !existsSync(source)) {
  console.error('Usage: node scripts/link-key.mjs <path-to-source-env-file>');
  process.exit(2);
}

const key = readFileSync(source, 'utf8')
  .split('\n')
  .find((line) => line.startsWith('ANTHROPIC_API_KEY='))
  ?.slice('ANTHROPIC_API_KEY='.length)
  .trim();

if (!key) {
  console.error(`No ANTHROPIC_API_KEY found in ${source}`);
  process.exit(1);
}

const target = '.env.local';
const existing = existsSync(target) ? readFileSync(target, 'utf8') : '';
const lines = existing.split('\n').filter((l) => l.trim() && !l.startsWith('ANTHROPIC_API_KEY='));
lines.unshift(`ANTHROPIC_API_KEY=${key}`);

writeFileSync(target, `${lines.join('\n')}\n`, { mode: 0o600 });
console.log(`Wrote ANTHROPIC_API_KEY (${key.length} chars) into ${target}`);
