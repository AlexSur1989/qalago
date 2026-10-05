/**
 * Stage 8 — local CI-adjacent HTTP smoke (API must be on qalago_dev).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const apiBase = process.env.QALAGO_API_BASE ?? 'http://localhost:3002/api/v1';

const checks = [];

async function health() {
  const res = await fetch(`${apiBase}/health`);
  checks.push(['API health', res.ok, String(res.status)]);
}

function runNode(rel, extraArgs = []) {
  const r = spawnSync(process.execPath, [path.join(root, rel), ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, QALAGO_API_BASE: apiBase },
  });
  const ok = r.status === 0;
  checks.push([rel, ok, ok ? 'exit 0' : (r.stderr || r.stdout || '').trim().slice(0, 200)]);
}

await health();
runNode('services/catalog-api/scripts/dev/_stage4-auth-qa.mjs');
runNode('services/catalog-api/scripts/dev/_stage6-monetization-qa.mjs');
runNode('scripts/check-google-play-launch-mode.mjs', [apiBase]);

console.log('\n--- Stage 8 HTTP smoke ---');
let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
