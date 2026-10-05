#!/usr/bin/env node
/**
 * Non-destructive Google Play launch monetization gate.
 * Usage: node scripts/check-google-play-launch-mode.mjs [baseUrl]
 * Default baseUrl: http://localhost:3001/api/v1
 * Exit 0 when monetizationMode === LAUNCH and purchases are disabled.
 */
const base = (process.argv[2] ?? process.env.QALAGO_API_BASE ?? 'http://localhost:3001/api/v1').replace(
  /\/$/,
  '',
);

async function main() {
  const res = await fetch(`${base}/app-config`);
  if (!res.ok) {
    console.error(`FAIL: app-config HTTP ${res.status}`);
    process.exit(1);
  }
  const body = await res.json();
  const mode = body.monetizationMode;
  const pass =
    mode === 'LAUNCH' &&
    body.canPurchasePlans === false &&
    body.canPurchaseAds === false &&
    body.launchAccessActive === true;

  console.log(
    JSON.stringify(
      {
        pass,
        expectedMode: 'LAUNCH',
        actualMode: mode,
        canPurchasePlans: body.canPurchasePlans,
        canPurchaseAds: body.canPurchaseAds,
        launchAccessActive: body.launchAccessActive,
        configRevision: body.configRevision,
      },
      null,
      2,
    ),
  );

  if (!pass) {
    console.error('FAIL: set Admin → Monetization to LAUNCH before first public release.');
    process.exit(1);
  }
  console.log('PASS: launch monetization gate ready for Google Play release.');
}

main().catch((err) => {
  console.error('FAIL:', err.message ?? err);
  process.exit(1);
});
