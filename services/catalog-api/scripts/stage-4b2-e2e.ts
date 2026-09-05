/**
 * DEV E2E helper for Stage 4B.2 — run: npx ts-node scripts/stage-4b2-e2e.ts
 */
import { AdCampaignStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = process.env.API_BASE ?? 'http://localhost:3002/api/v1';

async function auth(phone: string, accountType?: 'business') {
  const send = await fetch(`${API}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  }).then((r) => r.json()) as { debugCode?: string };
  if (!send.debugCode) throw new Error('OTP debug code unavailable');
  const body: Record<string, string> = { phone, code: send.debugCode };
  if (accountType) body.accountType = accountType;
  const verify = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

async function main() {
  const business = await prisma.business.findUnique({
    where: { slug: 'coffee-house-uralsk' },
    include: { city: true },
  });
  if (!business) throw new Error('coffee-house-uralsk not found');

  const placement = await prisma.adPlacement.findUnique({
    where: { code: 'HOME_VIP_BANNER' },
  });
  if (!placement) throw new Error('HOME_VIP_BANNER placement not found');

  const originalMax = placement.maxActiveCampaigns;
  await prisma.adPlacement.update({
    where: { id: placement.id },
    data: { maxActiveCampaigns: 2 },
  });

  const ownerToken = await auth('+77000000002', 'business');
  const adminToken = await auth('+77000000001');

  async function createVipCreative(suffix: string) {
    return api(ownerToken, '/monetization/creatives', {
      method: 'POST',
      body: JSON.stringify({
        businessId: business!.id,
        type: 'BANNER',
        title: `QA VIP 4B2 ${suffix}`,
        targetType: 'BUSINESS',
        targetId: business!.id,
      }),
    }) as Promise<{ id: string }>;
  }

  async function payVipOrder(creativeId: string) {
    const order = await api(ownerToken, '/monetization/orders', {
      method: 'POST',
      body: JSON.stringify({
        businessId: business!.id,
        items: [{ productCode: 'VIP_BANNER', durationDays: 7, creativeId }],
      }),
    }) as { id: string; payments: Array<{ id: string }> };
    await api(adminToken, `/admin/monetization/payments/${order.payments[0].id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return order.id;
  }

  await prisma.adCampaign.updateMany({
    where: {
      businessId: business.id,
      product: { type: 'VIP_BANNER' },
      status: { in: ['ACTIVE', 'SCHEDULED', 'PENDING_MODERATION'] },
    },
    data: { status: AdCampaignStatus.CANCELLED },
  });

  const crA = await createVipCreative('A');
  await payVipOrder(crA.id);

  const vipA = await prisma.adCampaign.findFirst({
    where: { creativeId: crA.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!vipA || vipA.status !== AdCampaignStatus.PENDING_MODERATION) {
    throw new Error('Campaign A should be PENDING_MODERATION');
  }
  console.log('Campaign A PENDING_MODERATION:', vipA.id);

  const quoteAfterA = await api(ownerToken, '/monetization/quote', {
    method: 'POST',
    body: JSON.stringify({
      businessId: business.id,
      productCode: 'VIP_BANNER',
      durationDays: 7,
    }),
  }) as { availability: { available: boolean; activeCount?: number } };
  console.log('Availability after A:', quoteAfterA.availability);

  const crB = await createVipCreative('B');
  const orderB = await api(ownerToken, '/monetization/orders', {
    method: 'POST',
    body: JSON.stringify({
      businessId: business.id,
      items: [{ productCode: 'VIP_BANNER', durationDays: 7, creativeId: crB.id }],
    }),
  }) as { id: string; payments: Array<{ id: string }> };
  await api(adminToken, `/admin/monetization/payments/${orderB.payments[0].id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  await api(adminToken, `/admin/monetization/creatives/${crB.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  console.log('Campaign B approved (ACTIVE)');

  const crC = await createVipCreative('C');
  let blocked = false;
  try {
    await api(ownerToken, '/monetization/orders', {
      method: 'POST',
      body: JSON.stringify({
        businessId: business.id,
        items: [{ productCode: 'VIP_BANNER', durationDays: 7, creativeId: crC.id }],
      }),
    });
  } catch {
    blocked = true;
  }
  if (!blocked) {
    throw new Error('Third VIP order should be blocked at maxActive=2');
  }
  console.log('Third VIP purchase blocked: OK');

  const countBeforeApprove = await prisma.adCampaign.count({
    where: {
      status: {
        in: [
          AdCampaignStatus.ACTIVE,
          AdCampaignStatus.SCHEDULED,
          AdCampaignStatus.PENDING_MODERATION,
        ],
      },
      campaignPlacements: { some: { placementId: placement.id } },
      startAt: { lt: new Date(Date.now() + 7 * 86400000) },
      endAt: { gt: new Date() },
    },
  });

  await api(adminToken, `/admin/monetization/creatives/${crA.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const countAfterApprove = await prisma.adCampaign.count({
    where: {
      status: {
        in: [
          AdCampaignStatus.ACTIVE,
          AdCampaignStatus.SCHEDULED,
          AdCampaignStatus.PENDING_MODERATION,
        ],
      },
      campaignPlacements: { some: { placementId: placement.id } },
      startAt: { lt: new Date(Date.now() + 7 * 86400000) },
      endAt: { gt: new Date() },
    },
  });

  if (countAfterApprove !== countBeforeApprove) {
    throw new Error(
      `Approval changed capacity count: before=${countBeforeApprove} after=${countAfterApprove}`,
    );
  }
  console.log('Approval idempotency (same slot count): OK');

  await prisma.adCampaign.update({
    where: { id: vipA.id },
    data: { status: AdCampaignStatus.CANCELLED },
  });
  console.log('Cancelled campaign A — slot released');

  const crD = await createVipCreative('D');
  const orderD = await api(ownerToken, '/monetization/orders', {
    method: 'POST',
    body: JSON.stringify({
      businessId: business.id,
      items: [{ productCode: 'VIP_BANNER', durationDays: 7, creativeId: crD.id }],
    }),
  }) as { id: string };
  console.log('New VIP order after cancel succeeded:', orderD.id);

  const serve = await fetch(
    `${API}/monetization/ads/serve?placementCode=HOME_VIP_BANNER&citySlug=${business.city.slug}&sessionId=stage4b2-serve&limit=5`,
  ).then((r) => r.json()) as { items: Array<{ campaignId: string }> };
  const pendingServed = serve.items.some((i) => i.campaignId === vipA.id);
  if (pendingServed) {
    throw new Error('Cancelled/pending VIP must not serve');
  }
  console.log('Serve excludes non-active VIP: OK');

  await prisma.adPlacement.update({
    where: { id: placement.id },
    data: { maxActiveCampaigns: originalMax },
  });

  // Wrong-business creative: same owner, creative owned by another business
  const otherBusiness = await prisma.business.findFirst({
    where: { slug: 'medline-uralsk', ownerId: business.ownerId },
  });
  if (otherBusiness) {
    const foreignCreative = await api(ownerToken, '/monetization/creatives', {
      method: 'POST',
      body: JSON.stringify({
        businessId: otherBusiness.id,
        type: 'BANNER',
        title: 'QA VIP 4B2 foreign biz',
        targetType: 'BUSINESS',
        targetId: otherBusiness.id,
      }),
    }) as { id: string };

    let wrongBizBlocked = false;
    try {
      await api(ownerToken, '/monetization/orders', {
        method: 'POST',
        body: JSON.stringify({
          businessId: business.id,
          items: [
            {
              productCode: 'VIP_BANNER',
              durationDays: 7,
              creativeId: foreignCreative.id,
            },
          ],
        }),
      });
    } catch (err) {
      wrongBizBlocked =
        err instanceof Error && err.message.includes('CREATIVE_NOT_OWNED');
    }
    if (!wrongBizBlocked) {
      throw new Error('Wrong-business creative should be rejected with CREATIVE_NOT_OWNED');
    }
    console.log('Wrong-business creative rejected: OK');
  } else {
    console.log('Skipped wrong-business E2E (medline-uralsk not found for same owner)');
  }

  console.log('\nStage 4B.2 E2E: ALL PASSED');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
