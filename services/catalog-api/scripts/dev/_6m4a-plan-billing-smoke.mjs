/**
 * 6.13M.4A — dev smoke: owner purchase → admin confirm (local API + qalago_dev).
 * Uses dev-login; rolls back test PlanPayment + business entitlement if tagged idempotencyKey.
 */
import { PrismaClient, BusinessPlanTier, PlanPaymentStatus } from '@prisma/client';

const BASE = process.env.CATALOG_API_BASE ?? 'http://localhost:3002/api/v1';
const OWNER_PHONE = process.env.SMOKE_OWNER_PHONE ?? '+77000000002';
const ADMIN_PHONE = process.env.SMOKE_ADMIN_PHONE ?? '+77000000001';
const IDEM = `6m4a-smoke-${Date.now()}`;

const prisma = new PrismaClient();

function log(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function devLogin(phone) {
  const res = await api('/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`dev-login failed: ${JSON.stringify(res)}`);
  }
  return res.body.accessToken;
}

async function main() {
  const health = await api('/health');
  if (health.status >= 500) {
    log('skip', { reason: 'API not reachable', health });
    process.exit(0);
  }

  const ownerToken = await devLogin(OWNER_PHONE);
  const adminToken = await devLogin(ADMIN_PHONE);

  const ownerUser = await prisma.user.findUnique({ where: { phone: OWNER_PHONE } });
  if (!ownerUser) throw new Error('owner user missing');

  const business = await prisma.business.findFirst({
    where: { ownerId: ownerUser.id, planTier: BusinessPlanTier.FREE },
    select: { id: true, planTier: true, planExpiresAt: true },
  });
  if (!business) {
    log('skip', { reason: 'no FREE-owned business for smoke owner' });
    process.exit(0);
  }

  const beforeBiz = { ...business };
  const adCountsBefore = {
    orders: await prisma.order.count({ where: { businessId: business.id } }),
    campaigns: await prisma.adCampaign.count({ where: { businessId: business.id } }),
  };

  const auth = (token) => (path, init = {}) =>
    api(path, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

  const owner = auth(ownerToken);
  const admin = auth(adminToken);

  const purchase = await owner(`/businesses/${business.id}/plan/purchases`, {
    method: 'POST',
    body: JSON.stringify({ tier: 'BASIC', idempotencyKey: IDEM }),
  });
  log('owner_purchase', { status: purchase.status, id: purchase.body?.id, paymentStatus: purchase.body?.status });

  const bizAfterPending = await prisma.business.findUnique({
    where: { id: business.id },
    select: { planTier: true, planExpiresAt: true },
  });
  log('business_after_pending', {
    unchanged: bizAfterPending?.planTier === beforeBiz.planTier && bizAfterPending?.planExpiresAt === beforeBiz.planExpiresAt,
    planTier: bizAfterPending?.planTier,
  });

  const paymentId = purchase.body?.id;
  if (!paymentId || purchase.status >= 400) {
    throw new Error(`purchase failed: ${JSON.stringify(purchase)}`);
  }

  const confirm1 = await admin(`/admin/plans/payments/${paymentId}/confirm`, { method: 'POST' });
  log('admin_confirm_1', {
    status: confirm1.status,
    alreadyCompleted: confirm1.body?.alreadyCompleted,
    tier: confirm1.body?.plan?.effectiveTier ?? confirm1.body?.plan?.tier,
  });

  const notifCount1 = await prisma.notification.count({
    where: { businessId: business.id, type: 'PLAN_ACTIVATED' },
  });

  const confirm2 = await admin(`/admin/plans/payments/${paymentId}/confirm`, { method: 'POST' });
  log('admin_confirm_2', { status: confirm2.status, alreadyCompleted: confirm2.body?.alreadyCompleted });

  const notifCount2 = await prisma.notification.count({
    where: { businessId: business.id, type: 'PLAN_ACTIVATED' },
  });

  const adCountsAfter = {
    orders: await prisma.order.count({ where: { businessId: business.id } }),
    campaigns: await prisma.adCampaign.count({ where: { businessId: business.id } }),
  };
  log('ad_isolation', {
    ordersDelta: adCountsAfter.orders - adCountsBefore.orders,
    campaignsDelta: adCountsAfter.campaigns - adCountsBefore.campaigns,
  });

  log('notifications', { afterFirstConfirm: notifCount1, afterSecondConfirm: notifCount2, duplicate: notifCount2 > notifCount1 });

  // Downgrade attempt on VIP if any VIP business owned by owner
  const vipBiz = await prisma.business.findFirst({
    where: {
      ownerId: ownerUser.id,
      planTier: BusinessPlanTier.VIP,
      planExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (vipBiz) {
    const down = await owner(`/businesses/${vipBiz.id}/plan/purchases`, {
      method: 'POST',
      body: JSON.stringify({ tier: 'BASIC', idempotencyKey: `${IDEM}-down` }),
    });
    log('downgrade_attempt', { status: down.status, code: down.body?.code ?? down.body?.message });
  } else {
    log('downgrade_attempt', { skipped: true, reason: 'no active VIP business for owner' });
  }

  // Same-tier renewal: pick PREMIUM with future expiry if exists
  const premiumBiz = await prisma.business.findFirst({
    where: {
      ownerId: ownerUser.id,
      planTier: BusinessPlanTier.PREMIUM,
      planExpiresAt: { gt: new Date() },
    },
    select: { id: true, planExpiresAt: true },
  });
  if (premiumBiz) {
    const oldExp = premiumBiz.planExpiresAt;
    const ren = await owner(`/businesses/${premiumBiz.id}/plan/purchases`, {
      method: 'POST',
      body: JSON.stringify({ tier: 'PREMIUM', idempotencyKey: `${IDEM}-renew` }),
    });
    if (ren.status < 400 && ren.body?.id) {
      await admin(`/admin/plans/payments/${ren.body.id}/confirm`, { method: 'POST' });
      const after = await prisma.planPayment.findUnique({ where: { id: ren.body.id } });
      const biz = await prisma.business.findUnique({
        where: { id: premiumBiz.id },
        select: { planExpiresAt: true },
      });
      log('renewal_smoke', {
        oldExpiry: oldExp?.toISOString(),
        newExpiry: biz?.planExpiresAt?.toISOString(),
        paymentExpiresAt: after?.expiresAt?.toISOString(),
      });
    } else {
      log('renewal_smoke', { skipped: true, purchase: ren.status });
    }
  } else {
    log('renewal_smoke', { skipped: true, reason: 'no active PREMIUM business' });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
