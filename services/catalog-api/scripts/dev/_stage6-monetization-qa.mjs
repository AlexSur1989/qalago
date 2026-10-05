/**
 * Stage 6 — monetization / launch-mode local HTTP QA (read-only on flags).
 * Usage: node scripts/dev/_stage6-monetization-qa.mjs
 */
const BASE = process.env.QALAGO_API_BASE ?? 'http://localhost:3002/api/v1';
const ADMIN_PHONE = '+77000000005';

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function json(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  const app = await json('GET', '/app-config');
  record('GET /app-config', app.status === 200, `mode=${app.data?.monetizationMode}`);

  const pf = await json('GET', '/platform-features');
  const aligned =
    pf.status === 200 &&
    pf.data?.monetizationMode === app.data?.monetizationMode &&
    pf.data?.canPurchasePlans === app.data?.canPurchasePlans;
  record('platform-features aligns with app-config', aligned);

  const launchScriptPass =
    app.data?.monetizationMode === 'LAUNCH' &&
    app.data?.canPurchasePlans === false &&
    app.data?.canPurchaseAds === false &&
    app.data?.launchAccessActive === true;
  record(
    'Google Play launch gate (LAUNCH ⇒ pass)',
    launchScriptPass,
    `mode=${app.data?.monetizationMode}`,
  );

  const login = await json('POST', '/auth/dev-login', { phone: ADMIN_PHONE });
  record('admin dev-login for launch-check', login.status === 200 || login.status === 201);
  if (login.data?.accessToken) {
    const check = await json('GET', '/admin/platform-features/google-play-launch-check', undefined, {
      Authorization: `Bearer ${login.data.accessToken}`,
    });
    record(
      'GET google-play-launch-check',
      check.status === 200 && check.data?.actualMode != null,
      JSON.stringify(check.data),
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
