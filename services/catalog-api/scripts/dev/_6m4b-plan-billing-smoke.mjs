/**
 * 6.13M.4B — full plan billing HTTP smoke (local dev only).
 * Ensures dev StaffAccess for seeded super admin; does not change production code.
 */
import { createHash } from 'node:crypto';
import {
  PrismaClient,
  BusinessPlanTier,
  NotificationType,
  PlanPaymentStatus,
  UserRole,
} from '@prisma/client';

const BASE = process.env.CATALOG_API_BASE ?? 'http://localhost:3002/api/v1';
const OWNER_PHONE = process.env.SMOKE_OWNER_PHONE ?? '+77000000002';
const ADMIN_PHONE = process.env.SMOKE_ADMIN_PHONE ?? '+77000000001';
const IDEM = `6m4b-smoke-${Date.now()}`;
const SMOKE_BUSINESS_ID = process.env.SMOKE_BUSINESS_ID;

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
    throw new Error(`dev-login failed ${phone}: ${JSON.stringify(res)}`);
  }
  if (res.body.mfaRequired) {
    throw new Error(`dev-login requires MFA for ${phone} — configure dev staff MFA or use ADMIN role without mandatory MFA`);
  }
  if (!res.body.accessToken) {
    throw new Error(`dev-login missing accessToken: ${JSON.stringify(res)}`);
  }
  return res.body.accessToken;
}

function hashOtp(code) {
  return createHash('sha256').update(code).digest('hex');
}

async function seedDevOtp(phone, code) {
  await prisma.otpCode.updateMany({ where: { phone, consumed: false }, data: { consumed: true } });
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
}

async function staffStepUp(adminToken) {
  const code = '4242';
  await seedDevOtp(ADMIN_PHONE, code);
  const step = await api('/auth/staff/step-up', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  if (step.status >= 400 || !step.body?.accessToken) {
    throw new Error(`staff step-up failed: ${JSON.stringify(step)}`);
  }
  return step.body.accessToken;
}

async function ensureDevStaffAccess(adminUserId) {
  await prisma.staffAccess.upsert({
    where: { userId: adminUserId },
    create: {
      userId: adminUserId,
      staffRole: UserRole.SUPER_ADMIN,
      isActive: true,
      mfaRequired: false,
    },
    update: { isActive: true, staffRole: UserRole.SUPER_ADMIN, mfaRequired: false },
  });
}

async function countAdArtifacts(businessId) {
  const [orders, campaigns, payments, creatives, placements, reservations] = await Promise.all([
    prisma.order.count({ where: { businessId } }),
    prisma.adCampaign.count({ where: { businessId } }),
    prisma.payment.count({ where: { order: { businessId } } }),
    prisma.adCreative.count({ where: { businessId } }),
    prisma.adCampaignPlacement.count({ where: { campaign: { businessId } } }),
    prisma.adInventoryReservation.count({ where: { businessId } }),
  ]);
  return { orders, campaigns, payments, creatives, placements, reservations };
}

async function main() {
  const health = await api('/health');
  if (health.status >= 500) {
    log('blocked', { reason: 'API not reachable — start catalog-api on :3002', health });
    process.exit(2);
  }

  const adminUser = await prisma.user.findUnique({ where: { phone: ADMIN_PHONE } });
  const ownerUser = await prisma.user.findUnique({ where: { phone: OWNER_PHONE } });
  if (!adminUser || !ownerUser) {
    throw new Error('Missing seeded dev users (+77000000001 / +77000000002)');
  }

  await ensureDevStaffAccess(adminUser.id);

  const business = SMOKE_BUSINESS_ID
    ? await prisma.business.findFirst({
        where: { id: SMOKE_BUSINESS_ID, ownerId: ownerUser.id },
        select: { id: true, planTier: true, planExpiresAt: true },
      })
    : await prisma.business.findFirst({
        where: { ownerId: ownerUser.id, planTier: BusinessPlanTier.FREE },
        select: { id: true, planTier: true, planExpiresAt: true },
      });
  if (!business) {
    log('blocked', { reason: 'No FREE business owned by dev owner — pick another fixture' });
    process.exit(2);
  }

  const pre = {
    planTier: business.planTier,
    planExpiresAt: business.planExpiresAt?.toISOString() ?? null,
    planPaymentCount: await prisma.planPayment.count({ where: { businessId: business.id } }),
    ads: await countAdArtifacts(business.id),
  };
  log('pre_smoke', { businessId: business.id, ...pre });

  const ownerToken = await devLogin(OWNER_PHONE);
  const adminBaseToken = await devLogin(ADMIN_PHONE);
  const adminToken = await staffStepUp(adminBaseToken);
  log('dev_auth', { owner: OWNER_PHONE, admin: ADMIN_PHONE, staffStepUp: true });

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

  const legalCurrent = await owner('/legal/current?locale=RU');
  const pending = legalCurrent.body?.pendingAcceptance ?? [];
  if (pending.length) {
    const items = pending.map((p) => ({
      documentId: p.documentId,
      documentVersion: p.version,
    }));
    const accept = await owner('/legal/me/accept-required', {
      method: 'POST',
      body: JSON.stringify({ acceptanceSource: 'LOGIN', locale: 'RU', items }),
    });
    log('owner_legal_accept', { httpStatus: accept.status, pendingCount: pending.length });
  } else {
    log('owner_legal_accept', { skipped: true, reason: 'no pending acceptance' });
  }

  const purchase = await owner(`/businesses/${business.id}/plan/purchases`, {
    method: 'POST',
    body: JSON.stringify({ tier: 'BASIC', idempotencyKey: IDEM }),
  });
  log('owner_purchase', {
    httpStatus: purchase.status,
    id: purchase.body?.id,
    status: purchase.body?.status,
    amountKzt: purchase.body?.amountKzt,
    periodDays: purchase.body?.periodDays,
    paidAt: purchase.body?.paidAt,
  });

  if (purchase.status >= 400) throw new Error(`purchase failed: ${JSON.stringify(purchase)}`);

  const afterPending = await prisma.business.findUnique({
    where: { id: business.id },
    select: { planTier: true, planExpiresAt: true },
  });
  const pendingRow = await prisma.planPayment.findUnique({ where: { id: purchase.body.id } });
  const adsAfterPurchase = await countAdArtifacts(business.id);
  const countPlanActivated = () =>
    prisma.notification.count({
      where: { userId: ownerUser.id, type: NotificationType.PLAN_ACTIVATED },
    });
  const notifBefore = await countPlanActivated();
  const notifAfterPurchase = await countPlanActivated();

  log('after_pending_verify', {
    businessTierUnchanged: afterPending?.planTier === pre.planTier,
    dbStatus: pendingRow?.status,
    dbPaidAt: pendingRow?.paidAt,
    adsDelta: {
      orders: adsAfterPurchase.orders - pre.ads.orders,
      campaigns: adsAfterPurchase.campaigns - pre.ads.campaigns,
    },
    planActivatedDeltaAfterPurchase: notifAfterPurchase - notifBefore,
  });

  const list = await admin(`/admin/plans/payments?status=PENDING&limit=50`);
  const listed = Array.isArray(list.body?.items)
    ? list.body.items.some((i) => i.id === purchase.body.id)
    : false;
  log('admin_list', { httpStatus: list.status, pendingListed: listed });

  const confirm1 = await admin(`/admin/plans/payments/${purchase.body.id}/confirm`, { method: 'POST' });
  log('admin_confirm_1', {
    httpStatus: confirm1.status,
    alreadyCompleted: confirm1.body?.alreadyCompleted,
    tier: confirm1.body?.plan?.effectiveTier ?? confirm1.body?.plan?.tier,
  });

  const afterConfirm = await prisma.planPayment.findUnique({ where: { id: purchase.body.id } });
  const bizAfter = await prisma.business.findUnique({
    where: { id: business.id },
    select: { planTier: true, planExpiresAt: true },
  });
  const notif1 = await countPlanActivated();
  const adsAfterConfirm = await countAdArtifacts(business.id);

  log('after_confirm_verify', {
    paymentStatus: afterConfirm?.status,
    paidAtSet: !!afterConfirm?.paidAt,
    paymentExpiresAt: afterConfirm?.expiresAt?.toISOString(),
    businessPlanTier: bizAfter?.planTier,
    businessExpiresAt: bizAfter?.planExpiresAt?.toISOString(),
    expiresMatch: afterConfirm?.expiresAt?.getTime() === bizAfter?.planExpiresAt?.getTime(),
    planActivatedDeltaAfterConfirm: notif1 - notifBefore,
    adsDeltaFromPre: {
      orders: adsAfterConfirm.orders - pre.ads.orders,
      campaigns: adsAfterConfirm.campaigns - pre.ads.campaigns,
    },
  });

  const confirm2 = await admin(`/admin/plans/payments/${purchase.body.id}/confirm`, { method: 'POST' });
  const bizAfter2 = await prisma.business.findUnique({
    where: { id: business.id },
    select: { planExpiresAt: true },
  });
  const notif2 = await countPlanActivated();
  log('duplicate_confirm', {
    httpStatus: confirm2.status,
    alreadyCompleted: confirm2.body?.alreadyCompleted,
    expiryUnchanged: bizAfter2?.planExpiresAt?.getTime() === bizAfter?.planExpiresAt?.getTime(),
    notificationCountUnchanged: notif2 === notif1,
    planActivatedDeltaAfterDuplicate: notif2 - notifBefore,
  });

  log('cleanup', {
    note: 'Smoke PlanPayment and entitlement left in dev DB as billing test evidence',
    paymentId: purchase.body.id,
    idempotencyKey: IDEM,
  });

  const success =
    purchase.body?.status === 'PENDING' &&
    pendingRow?.status === PlanPaymentStatus.PENDING &&
    afterConfirm?.status === PlanPaymentStatus.COMPLETED &&
    confirm2.body?.alreadyCompleted === true &&
    bizAfter?.planTier === BusinessPlanTier.BASIC;

  log('result', { pass: success });
  if (!success) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
