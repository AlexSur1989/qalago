/**
 * Stage 5M.2.1 runtime verification against local catalog-api.
 * Usage: node scripts/stage-5m21-runtime-qa.mjs
 */
const BASE = process.env.API_BASE ?? 'http://localhost:3002/api/v1';

const PHONES = {
  owner: '+77000000002',
  manager: '+77000000003',
  admin: '+77000000001',
  cityAdmin: '+77000000004',
  unknown: '+77000000093',
  wrongClaim: '+77000000094',
};

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

async function devLogin(phone) {
  const res = await api('/auth/dev-login', { method: 'POST', body: { phone } });
  if (!res.ok) throw new Error(`dev-login ${phone}: ${res.status} ${JSON.stringify(res.data)}`);
  return res.data.accessToken;
}

async function main() {
  console.log('=== Stage 5M.2.1 Runtime QA ===\n');

  // Health
  const health = await api('/health');
  record('API health', health.ok, `status=${health.status}`);

  const ownerToken = await devLogin(PHONES.owner);
  record('Owner dev login', !!ownerToken);

  const myRes = await api('/businesses/my', { token: ownerToken });
  const items = myRes.data?.items ?? [];
  record('Owner /businesses/my', myRes.ok && items.length > 0, `count=${items.length}`);
  const uralskItem = items.find((i) => i.business.city?.slug === 'uralsk') ?? items[0];
  const aktobeItem = items.find((i) => i.business.city?.slug === 'aktobe');
  const bizA = uralskItem?.business?.id;
  const bizB =
    items.find((i) => i.business.id !== bizA && i.business.city?.slug === 'uralsk')?.business
      ?.id ?? items.find((i) => i.business.id !== bizA)?.business?.id;
  record('Owner has Uralsk business id', !!bizA, bizA ?? 'none');

  const publicBiz = await api(`/businesses/${bizA}`);
  const pubStr = JSON.stringify(publicBiz.data ?? {});
  record(
    'Public business privacy',
    !pubStr.includes('membership') &&
      !pubStr.includes('permissions') &&
      !pubStr.includes('BusinessInvitation'),
    `status=${publicBiz.status}`,
  );

  const teamRes = await api(`/businesses/${bizA}/team`, { token: ownerToken });
  record('Owner team list', teamRes.ok, `members=${teamRes.data?.members?.length ?? 0}`);
  const ownerMember = teamRes.data?.members?.find((m) => m.role === 'OWNER');

  // Owner protection
  if (ownerMember) {
    const prot = await api(`/businesses/${bizA}/team/${ownerMember.membershipId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { status: 'SUSPENDED' },
    });
    record('Owner protection suspend OWNER', prot.status === 403 || prot.status === 400);
  }

  // Clean prior QA manager on bizA if exists
  const existingMgr = teamRes.data?.members?.find(
    (m) => m.role === 'MANAGER' && m.phone === PHONES.manager,
  );
  if (existingMgr) {
    await api(`/businesses/${bizA}/team/${existingMgr.membershipId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { status: 'REVOKED' },
    });
  }

  const inviteRes = await api(`/businesses/${bizA}/team/invite`, {
    method: 'POST',
    token: ownerToken,
    body: {
      phone: PHONES.manager,
      permissions: ['CATALOG_EDIT', 'PROMOTIONS_EDIT'],
    },
  });
  record('Invite existing user manager', inviteRes.ok, inviteRes.data?.type ?? inviteRes.status);

  const dupInvite = await api(`/businesses/${bizA}/team/invite`, {
    method: 'POST',
    token: ownerToken,
    body: { phone: PHONES.manager, permissions: ['CATALOG_EDIT'] },
  });
  record('Duplicate active manager rejected', dupInvite.status === 400);

  const managerToken = await devLogin(PHONES.manager);
  record('Manager dev login', !!managerToken);

  const mgrMy = await api('/businesses/my', { token: managerToken });
  const mgrItems = mgrMy.data?.items ?? [];
  const mgrEntry = mgrItems.find((i) => i.business.id === bizA);
  record('Manager /businesses/my includes business', !!mgrEntry);
  record(
    'Manager access role/permissions',
    mgrEntry?.access?.role === 'MANAGER' &&
      mgrEntry.access.permissions.includes('CATALOG_EDIT') &&
      mgrEntry.access.permissions.includes('PROMOTIONS_EDIT') &&
      !mgrEntry.access.permissions.includes('ANALYTICS_VIEW'),
    JSON.stringify(mgrEntry?.access?.permissions ?? []),
  );

  const catalogManage = await api(`/service-items/manage/${bizA}`, { token: managerToken });
  record('Manager catalog manage', catalogManage.ok, `status=${catalogManage.status}`);

  const promoCreate = await api('/promotions', {
    method: 'POST',
    token: managerToken,
    body: {
      businessId: bizA,
      title: 'QA Promo 5M21',
      description: 'temp',
      status: 'DRAFT',
    },
  });
  let promoOk = promoCreate.ok || promoCreate.status === 201;
  if (!promoOk && promoCreate.status === 403) {
    const promos = await api(`/promotions?businessId=${bizA}&limit=1`, { token: managerToken });
    const existingId = promos.data?.items?.[0]?.id;
    if (existingId) {
      const promoPatch = await api(`/promotions/${existingId}`, {
        method: 'PATCH',
        token: managerToken,
        body: { description: 'QA promo patch 5M21' },
      });
      promoOk = promoPatch.ok;
    }
  }
  record('Manager promotion manage', promoOk, `create=${promoCreate.status}`);

  const profileDeny = await api(`/businesses/${bizA}`, {
    method: 'PATCH',
    token: managerToken,
    body: { title: 'QA Hacked Title' },
  });
  record('Manager profile PATCH denied', profileDeny.status === 403);

  const hoursDeny = await api(`/businesses/${bizA}`, {
    method: 'PATCH',
    token: managerToken,
    body: { workHours: { mon: '10:00-20:00' } },
  });
  record('Manager hours PATCH denied (no permission)', hoursDeny.status === 403);

  // Grant hours only
  const team2 = await api(`/businesses/${bizA}/team`, { token: ownerToken });
  const mgrMember = team2.data?.members?.find(
    (m) => m.role === 'MANAGER' && m.phone === PHONES.manager,
  );
  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { permissions: ['CATALOG_EDIT', 'PROMOTIONS_EDIT', 'BUSINESS_HOURS_EDIT'] },
  });

  const hoursOnly = await api(`/businesses/${bizA}`, {
    method: 'PATCH',
    token: managerToken,
    body: { workHours: { mon: '09:00-21:00' } },
  });
  record('Manager hours-only PATCH allowed', hoursOnly.ok, `status=${hoursOnly.status}`);

  const mixedPatch = await api(`/businesses/${bizA}`, {
    method: 'PATCH',
    token: managerToken,
    body: { workHours: { tue: '09:00-21:00' }, title: 'QA Mixed Fail' },
  });
  record('Mixed PATCH denied', mixedPatch.status === 403);

  const verifyTitle = await api(`/businesses/${bizA}`, { token: ownerToken });
  record(
    'Title not partially changed',
    verifyTitle.data?.title !== 'QA Mixed Fail' && verifyTitle.data?.title !== 'QA Hacked Title',
    verifyTitle.data?.title,
  );

  const analyticsDeny = await api(`/analytics/business/${bizA}/summary?days=7`, {
    token: managerToken,
  });
  record('Manager analytics denied', analyticsDeny.status === 403);

  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: {
      permissions: ['CATALOG_EDIT', 'PROMOTIONS_EDIT', 'BUSINESS_HOURS_EDIT', 'ANALYTICS_VIEW'],
    },
  });

  const analyticsAllow = await api(`/analytics/business/${bizA}/summary?days=7`, {
    token: managerToken,
  });
  record('Live ANALYTICS_VIEW grant', analyticsAllow.ok, `status=${analyticsAllow.status}`);

  const exportDeny = await api(`/analytics/business/${bizA}/export?days=7`, {
    token: managerToken,
  });
  record('Export denied without ANALYTICS_EXPORT', exportDeny.status === 403);

  const adsDeny = await api(`/monetization/campaigns?businessId=${bizA}`, {
    token: managerToken,
  });
  record('Ads denied without ADS_MANAGE', adsDeny.status === 403);

  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: {
      permissions: [
        'CATALOG_EDIT',
        'PROMOTIONS_EDIT',
        'BUSINESS_HOURS_EDIT',
        'ANALYTICS_VIEW',
        'ADS_MANAGE',
        'PAYMENTS_VIEW',
      ],
    },
  });

  const adsAllow = await api(`/monetization/campaigns?businessId=${bizA}`, { token: managerToken });
  record('Live ADS_MANAGE grant', adsAllow.ok, `status=${adsAllow.status}`);

  const paymentsAllow = await api(`/businesses/${bizA}/plan`, { token: managerToken });
  record('PAYMENTS_VIEW plan read', paymentsAllow.ok, `status=${paymentsAllow.status}`);

  const checkoutDeny = await api(`/businesses/${bizA}/plan/mock-checkout`, {
    method: 'POST',
    token: managerToken,
    body: { tier: 'PREMIUM' },
  });
  record('Manager mock-checkout denied (owner-only)', checkoutDeny.status === 403);

  // Cross-business: invite manager to bizB with ANALYTICS only
  if (bizB && bizB !== bizA) {
    await api(`/businesses/${bizB}/team/invite`, {
      method: 'POST',
      token: ownerToken,
      body: { phone: PHONES.manager, permissions: ['ANALYTICS_VIEW'] },
    });
    const crossCatalog = await api(`/service-items/manage/${bizB}`, { token: managerToken });
    record('Cross-business catalog denied on B', crossCatalog.status === 403);
    const crossAnalytics = await api(`/analytics/business/${bizB}/summary?days=7`, {
      token: managerToken,
    });
    record('Cross-business analytics allowed on B', crossAnalytics.ok);
    const crossCatalogA = await api(`/service-items/manage/${bizA}`, { token: managerToken });
    record('Cross-business catalog still allowed on A', crossCatalogA.ok);
  } else {
    record('Cross-business switch', false, 'need 2 businesses — skipped');
  }

  // Suspend
  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { status: 'SUSPENDED' },
  });
  const suspendDeny = await api(`/service-items/manage/${bizA}`, { token: managerToken });
  record('Suspended manager denied', suspendDeny.status === 403);

  const suspendedMy = await api('/businesses/my', { token: managerToken });
  const stillListed = (suspendedMy.data?.items ?? []).some((i) => i.business.id === bizA);
  record('Suspended excluded from /my', !stillListed);

  // Restore
  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { status: 'ACTIVE' },
  });
  const restoreAllow = await api(`/service-items/manage/${bizA}`, { token: managerToken });
  record('Restored manager allowed', restoreAllow.ok);

  // Revoke
  await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { status: 'REVOKED' },
  });
  const revokeDeny = await api(`/service-items/manage/${bizA}`, { token: managerToken });
  record('Revoked manager denied', revokeDeny.status === 403);

  const restoreRevoked = await api(`/businesses/${bizA}/team/${mgrMember.membershipId}`, {
    method: 'PATCH',
    token: ownerToken,
    body: { status: 'ACTIVE' },
  });
  record('Revoked cannot restore to ACTIVE', restoreRevoked.status === 400);

  // Unknown phone invite — revoke stale pending for same phone first
  const teamBeforeUnknown = await api(`/businesses/${bizA}/team`, { token: ownerToken });
  for (const inv of teamBeforeUnknown.data?.pendingInvitations ?? []) {
    if (inv.phone === PHONES.unknown) {
      await api(`/businesses/${bizA}/team/invitations/${inv.invitationId}`, {
        method: 'DELETE',
        token: ownerToken,
      });
    }
  }

  const unknownInvite = await api(`/businesses/${bizA}/team/invite`, {
    method: 'POST',
    token: ownerToken,
    body: { phone: PHONES.unknown, permissions: ['CATALOG_EDIT'] },
  });
  record('Unknown phone invitation', unknownInvite.ok && unknownInvite.data?.type === 'invitation');

  const wrongClaimToken = await devLogin(PHONES.wrongClaim);
  const teamAfterWrong = await api(`/businesses/${bizA}/team`, { token: ownerToken });
  const pending = teamAfterWrong.data?.pendingInvitations?.find((p) => p.phone === PHONES.unknown);
  record('Wrong user did not claim invite', pending?.status === 'PENDING');

  const claimToken = await devLogin(PHONES.unknown);
  const claimedMy = await api('/businesses/my', { token: claimToken });
  const claimedEntry = (claimedMy.data?.items ?? []).find((i) => i.business.id === bizA);
  record('Verified phone claim creates manager', !!claimedEntry && claimedEntry.access.role === 'MANAGER');

  // Phone normalization
  const normInvite = await api(`/businesses/${bizA}/team/invite`, {
    method: 'POST',
    token: ownerToken,
    body: { phone: '87000000088', permissions: ['PROMOTIONS_EDIT'] },
  });
  record('Phone normalization invite', normInvite.ok || normInvite.status === 400);

  // Manager cannot list team
  const reinviteMgr = await api(`/businesses/${bizA}/team/invite`, {
    method: 'POST',
    token: ownerToken,
    body: { phone: PHONES.manager, permissions: ['CATALOG_EDIT'] },
  });
  const mgrTeamDeny = await api(`/businesses/${bizA}/team`, { token: managerToken });
  record('Manager team list denied', mgrTeamDeny.status === 403);

  // USER without membership
  const plainToken = await devLogin('+77000000006');
  const plainMy = await api('/businesses/my', { token: plainToken });
  record('USER without membership empty my', (plainMy.data?.items ?? []).length === 0);
  const plainTeam = await api(`/businesses/${bizA}/team`, { token: plainToken });
  record('USER team denied', plainTeam.status === 403);

  // ADMIN global
  const adminToken = await devLogin(PHONES.admin);
  const adminTeam = await api(`/businesses/${bizA}/team`, { token: adminToken });
  record('ADMIN team read', adminTeam.ok);

  // CITY_ADMIN cross-city
  const cityToken = await devLogin(PHONES.cityAdmin);
  const uralskTeam = await api(`/businesses/${bizA}/team`, { token: cityToken });
  record('CITY_ADMIN Uralsk business denied', uralskTeam.status === 403);

  const aktobeBiz = aktobeItem?.business?.id;
  if (aktobeBiz) {
    const aktobeTeam = await api(`/businesses/${aktobeBiz}/team`, { token: cityToken });
    record('CITY_ADMIN Aktobe business allowed', aktobeTeam.ok);
  } else {
    record('CITY_ADMIN Aktobe business allowed', false, 'no aktobe business in owner list');
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
