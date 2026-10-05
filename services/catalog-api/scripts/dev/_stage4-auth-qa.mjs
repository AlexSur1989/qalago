/**
 * Stage 4 — local auth/session HTTP QA (read-only on users except session rows).
 * Usage: node scripts/dev/_stage4-auth-qa.mjs
 * Requires API at http://localhost:3002/api/v1
 */

const BASE = process.env.QALAGO_API_BASE ?? 'http://localhost:3002/api/v1';
const ADMIN_PHONE = '+77000000005';
const CONSUMER_PHONE = '+77000000003';

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
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

function decodeJwtPayload(token) {
  const part = token.split('.')[1];
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

async function main() {
  const ok = (s) => s === 200 || s === 201;

  record('health', ok((await json('GET', '/health')).status), 'GET /health');

  const adminLogin = await json('POST', '/auth/dev-login', { phone: ADMIN_PHONE });
  record(
    'admin dev-login',
    ok(adminLogin.status) && Boolean(adminLogin.data?.accessToken),
    !ok(adminLogin.status) ? JSON.stringify(adminLogin.data) : undefined,
  );
  if (!adminLogin.data?.accessToken) {
    printSummary();
    process.exit(1);
  }

  const adminToken = adminLogin.data.accessToken;
  const adminRefresh = adminLogin.data.refreshToken;
  const adminClaims = decodeJwtPayload(adminToken);
  record('admin JWT has sid', Boolean(adminClaims.sid), adminClaims.sid);

  const me = await json('GET', '/users/me', undefined, {
    Authorization: `Bearer ${adminToken}`,
  });
  record('admin GET /users/me', me.status === 200 && me.data?.role === 'ADMIN');

  const mfaStatus = await json('GET', '/auth/staff/mfa/status', undefined, {
    Authorization: `Bearer ${adminToken}`,
  });
  record(
    'admin MFA status',
    mfaStatus.status === 200,
    mfaStatus.data?.enabled != null ? `enabled=${mfaStatus.data.enabled}` : String(mfaStatus.status),
  );

  const refresh1 = await json('POST', '/auth/refresh', { refreshToken: adminRefresh });
  record(
    'refresh rotates tokens',
    ok(refresh1.status) &&
      refresh1.data?.refreshToken &&
      refresh1.data.refreshToken !== adminRefresh,
    !ok(refresh1.status) ? `status=${refresh1.status}` : undefined,
  );
  const newRefresh = refresh1.data?.refreshToken ?? adminRefresh;
  const newAccess = refresh1.data?.accessToken ?? adminToken;
  const afterRefreshClaims = decodeJwtPayload(newAccess);
  record(
    'mfaEnrollOnly absent after refresh (full admin session)',
    afterRefreshClaims.mfaEnrollOnly !== true,
  );

  const logoutAll = await json('POST', '/auth/logout-all', undefined, {
    Authorization: `Bearer ${newAccess}`,
  });
  record(
    'admin logout-all',
    ok(logoutAll.status),
    !ok(logoutAll.status) ? `status=${logoutAll.status} ${JSON.stringify(logoutAll.data)}` : undefined,
  );

  const replay = await json('POST', '/auth/refresh', { refreshToken: adminRefresh });
  record('replay old refresh rejected', replay.status === 401, `status=${replay.status}`);

  const badMfa = await json('POST', '/auth/staff/mfa/verify', {
    challengeToken: 'invalid-challenge',
    totp: '000000',
  });
  record('invalid MFA challenge rejected', badMfa.status === 401 || badMfa.status === 400);

  const consumerLogin = await json('POST', '/auth/dev-login', { phone: CONSUMER_PHONE });
  record(
    'consumer dev-login',
    ok(consumerLogin.status) && consumerLogin.data?.user?.role === 'USER',
    !ok(consumerLogin.status) ? JSON.stringify(consumerLogin.data) : undefined,
  );

  if (consumerLogin.data?.refreshToken) {
    const cRefresh = consumerLogin.data.refreshToken;
    const cAccess = consumerLogin.data.accessToken;
    const cMe = await json('GET', '/users/me', undefined, {
      Authorization: `Bearer ${cAccess}`,
    });
    record('consumer GET /users/me', cMe.status === 200);

    const logout = await json('POST', '/auth/logout', { refreshToken: cRefresh });
    record('consumer logout', logout.status === 200 || logout.status === 201);

    const afterLogout = await json('POST', '/auth/refresh', { refreshToken: cRefresh });
    record('refresh after logout rejected', afterLogout.status === 401, `status=${afterLogout.status}`);
  }

  printSummary();
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
}

function printSummary() {
  const failed = results.filter((r) => !r.pass);
  console.log('\n---');
  console.log(`Total: ${results.length}, failed: ${failed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
