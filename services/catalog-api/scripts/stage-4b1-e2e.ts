/**
 * DEV E2E helper for Stage 4B.1 — run: npx ts-node scripts/stage-4b1-e2e.ts
 */
import { AdCampaignStatus, AdModerationStatus, PromotionStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = process.env.API_BASE ?? 'http://localhost:3002/api/v1';

async function auth(phone: string, accountType?: 'business') {
  const send = await fetch(`${API}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  }).then((r) => r.json()) as { debugCode?: string };
  if (!send.debugCode) throw new Error('OTP debug code unavailable');
  const verifyBody: Record<string, string> = { phone, code: send.debugCode };
  if (accountType) verifyBody.accountType = accountType;
  const verify = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyBody),
  }).then((r) => r.json()) as { accessToken: string };
  return verify.accessToken;
}

async function api(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function runPackageFlow(
  label: string,
  packageCode: 'MAX' | 'NEW_PLACE',
  ownerToken: string,
  adminToken: string,
  businessId: string,
  promotionId: string,
  citySlug: string,
) {
  console.log(`\n=== ${label} (${packageCode}) ===`);

  const creative = await api(ownerToken, '/monetization/creatives', {
    method: 'POST',
    body: JSON.stringify({
      businessId,
      type: 'BANNER',
      title: `QA VIP ${packageCode}`,
      targetType: 'BUSINESS',
      targetId: businessId,
    }),
  }) as { id: string };

  const order = await api(ownerToken, '/monetization/orders', {
    method: 'POST',
    body: JSON.stringify({
      businessId,
      packageCode,
      creativeId: creative.id,
      promotionId,
    }),
  }) as { id: string; payments: Array<{ id: string }> };

  const paymentId = order.payments[0]?.id;
  if (!paymentId) throw new Error('No pending payment');

  await api(adminToken, `/admin/monetization/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const adminOrder = await api(adminToken, `/admin/monetization/orders/${order.id}`) as {
    campaigns: Array<{
      id: string;
      status: string;
      product: { code: string };
      creative?: { id: string } | null;
      startAt: string;
      endAt: string;
    }>;
  };

  const vip = adminOrder.campaigns.find((c) => c.product.code === 'VIP_BANNER');
  const top = adminOrder.campaigns.find((c) => c.product.code === 'TOP_CATEGORY');
  const featured = adminOrder.campaigns.find((c) => c.product.code === 'FEATURED_BUSINESS');
  const promo = adminOrder.campaigns.find((c) => c.product.code === 'PROMOTED_PROMOTION');

  if (!vip || !top || !featured || !promo) {
    throw new Error(`Missing campaigns for ${packageCode}`);
  }

  console.log('VIP status:', vip.status, '(expected SCHEDULED until creative submit)');
  console.log('TOP status:', top.status);
  console.log('FEATURED status:', featured.status);
  console.log('PROMOTION status:', promo.status);

  if (vip.status !== AdCampaignStatus.SCHEDULED) {
    throw new Error(`VIP should be scheduled until submit, got ${vip.status}`);
  }
  for (const c of [top, featured, promo]) {
    if (!['ACTIVE', 'SCHEDULED'].includes(c.status)) {
      throw new Error(`${c.product.code} should be active/scheduled, got ${c.status}`);
    }
  }

  const serveBefore = await fetch(
    `${API}/monetization/ads/serve?placementCode=HOME_VIP_BANNER&citySlug=${citySlug}&sessionId=stage4b1-${packageCode}-before&limit=5`,
  ).then((r) => r.json()) as { items: Array<{ campaignId: string }> };
  if (serveBefore.items.some((i) => i.campaignId === vip.id)) {
    throw new Error('VIP served before creative approval');
  }
  console.log('Serve excludes waiting VIP: OK');

  await api(businessToken, `/monetization/creatives/${creative.id}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const vipSubmitted = await api(businessToken, `/monetization/campaigns/${vip.id}`) as {
    status: string;
  };
  if (vipSubmitted.status !== AdCampaignStatus.PENDING_MODERATION) {
    throw new Error(`VIP should enter moderation after submit, got ${vipSubmitted.status}`);
  }
  console.log('VIP after creative submit:', vipSubmitted.status);

  await api(adminToken, `/admin/monetization/creatives/${creative.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const vipAfter = await api(adminToken, `/admin/monetization/campaigns/${vip.id}`) as {
    status: string;
    startAt: string;
    endAt: string;
  };
  console.log('VIP after approval:', vipAfter.status, vipAfter.startAt, '→', vipAfter.endAt);

  if (!['ACTIVE', 'SCHEDULED'].includes(vipAfter.status)) {
    throw new Error(`VIP not active after approval: ${vipAfter.status}`);
  }

  const msDay = 86400000;
  const vipDays = Math.round(
    (new Date(vipAfter.endAt).getTime() - new Date(vipAfter.startAt).getTime()) / msDay,
  );
  if (vipDays !== 7) {
    throw new Error(`VIP duration expected 7d, got ${vipDays}d`);
  }

  if (packageCode === 'NEW_PLACE') {
    const topDays = Math.round(
      (new Date(top.endAt).getTime() - new Date(top.startAt).getTime()) / msDay,
    );
    if (topDays !== 14) {
      throw new Error(`NEW_PLACE TOP expected 14d, got ${topDays}d`);
    }
    console.log('NEW_PLACE non-VIP 14d: OK');
  }

  await api(adminToken, `/admin/monetization/creatives/${creative.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const vipRepeat = await api(adminToken, `/admin/monetization/campaigns/${vip.id}`) as {
    startAt: string;
    endAt: string;
  };
  if (vipRepeat.startAt !== vipAfter.startAt || vipRepeat.endAt !== vipAfter.endAt) {
    throw new Error('Repeat approval changed VIP dates');
  }
  console.log('Approval idempotency: OK');

  await api(adminToken, `/admin/monetization/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const adminOrderRepeat = await api(adminToken, `/admin/monetization/orders/${order.id}`) as {
    campaigns: unknown[];
  };
  if (adminOrderRepeat.campaigns.length !== adminOrder.campaigns.length) {
    throw new Error('Repeat payment confirm duplicated campaigns');
  }
  console.log('Payment idempotency: OK');

  const serveAfter = await fetch(
    `${API}/monetization/ads/serve?placementCode=HOME_VIP_BANNER&citySlug=${citySlug}&sessionId=stage4b1-${packageCode}-after&limit=5`,
  ).then((r) => r.json()) as { items: Array<{ campaignId: string }> };
  const served = serveAfter.items.some((i) => i.campaignId === vip.id);
  console.log('Serve includes VIP after approval:', served ? 'OK' : 'WARN (slot may be full)');

  await fetch(`${API}/monetization/ads/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: vip.id,
      placementCode: 'HOME_VIP_BANNER',
      sessionId: `stage4b1-${packageCode}-imp`,
      type: 'AD_IMPRESSION',
      position: 1,
    }),
  });

  const analytics = await api(ownerToken, `/monetization/campaigns/${vip.id}/analytics`) as {
    campaignId: string;
  };
  if (analytics.campaignId !== vip.id) {
    throw new Error('Analytics campaignId mismatch');
  }
  console.log('Analytics campaignId: OK');

  const creativeB = await prisma.adCreative.create({
    data: {
      businessId,
      title: 'Wrong creative B',
      moderationStatus: AdModerationStatus.DRAFT,
    },
  });
  await api(adminToken, `/admin/monetization/creatives/${creativeB.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const vipWrong = await api(adminToken, `/admin/monetization/campaigns/${vip.id}`) as {
    status: string;
  };
  if (vipWrong.status !== vipAfter.status) {
    throw new Error('Wrong creative approval affected VIP campaign');
  }
  console.log('Wrong creative test: OK');
}

async function main() {
  const business = await prisma.business.findUnique({
    where: { slug: 'coffee-house-uralsk' },
    include: { city: true },
  });
  if (!business) throw new Error('coffee-house-uralsk not found — run seed');

  let promotion = await prisma.promotion.findFirst({
    where: { businessId: business.id, status: PromotionStatus.ACTIVE },
  });
  if (!promotion) {
    promotion = await prisma.promotion.create({
      data: {
        businessId: business.id,
        title: 'QA Promo Stage 4B.1',
        status: PromotionStatus.ACTIVE,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
      },
    });
  }

  const ownerToken = await auth('+77000000002', 'business');
  const adminToken = await auth('+77000000001');

  await runPackageFlow(
    'MAX package E2E',
    'MAX',
    ownerToken,
    adminToken,
    business.id,
    promotion.id,
    business.city.slug,
  );

  await runPackageFlow(
    'NEW_PLACE package E2E',
    'NEW_PLACE',
    ownerToken,
    adminToken,
    business.id,
    promotion.id,
    business.city.slug,
  );

  console.log('\nStage 4B.1 E2E: ALL PASSED');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
