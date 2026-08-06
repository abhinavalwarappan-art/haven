/**
 * Single-message CLI. Check one message without starting the server.
 *
 *   npm run check -- "Your account will be closed, verify at bit.ly/xyz"
 *   echo "some message" | npm run check
 *   npm run check -- --json "message"
 */

import { runCheck, InvalidInputError } from '../src/lib/pipeline.js';
import { hasApiKey } from '../src/lib/classifier.js';

const LABEL: Record<string, string> = {
  scam: '🔴  LIKELY A SCAM',
  uncertain_be_careful: '🟡  BE CAREFUL',
  likely_safe: '🟢  LOOKS LEGIT',
};

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const positional = args.filter((a) => a !== '--json');

  const text = positional.length > 0 ? positional.join(' ') : await readStdin();

  if (!text.trim()) {
    process.stderr.write(
      'Usage: npm run check -- "the message to check"\n' +
        '       echo "the message" | npm run check\n'
    );
    process.exit(2);
  }

  if (!hasApiKey()) {
    process.stderr.write('⚠️  No GEMINI_API_KEY — using rules-only fallback.\n\n');
  }

  try {
    const result = await runCheck(text, { persist: false });

    if (json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }

    process.stdout.write(`\n${LABEL[result.verdict] ?? result.verdict}`);
    process.stdout.write(`   (${result.confidence}% confident)\n\n`);
    for (const reason of result.reasons) process.stdout.write(`  • ${reason}\n`);
    // Rendered from meta.notice, not a local string, so the API, the web UI
    // and this CLI cannot drift apart in what they tell someone about a
    // degraded result.
    if (result.meta.notice) {
      process.stdout.write(`\n  ⚠️  ${result.meta.notice}\n`);
    }
    process.stdout.write('\n');

    const suspicious = result.flags_detected.filter(
      (f) => !result.raw_signals.legitimacySignals.includes(f)
    );
    if (suspicious.length) {
      process.stdout.write(`  red flags: ${suspicious.join(', ')}\n`);
    }
    process.stdout.write(
      `  layer 1 risk score: ${result.raw_signals.riskScore}/100 · ${result.meta.duration_ms}ms · ${result.meta.classifier}\n\n`
    );
  } catch (err) {
    if (err instanceof InvalidInputError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(2);
    }
    throw err;
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
