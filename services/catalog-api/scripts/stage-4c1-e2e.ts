/**
 * DEV E2E helper for Stage 4C.1 — run: npx ts-node scripts/stage-4c1-e2e.ts
 */
import { BusinessPlanTier, PromotionStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API = process.env.API_BASE ?? 'http://localhost:3002/api/v1';

async function authOwner() {
  const send = await fetch(`${API}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+77000000002' }),
  }).then((r) => r.json()) as { debugCode?: string };
  if (!send.debugCode) throw new Error('OTP debug code unavailable — set app.otpDebug=true');
  const verify = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+77000000002', code: send.debugCode, accountType: 'business' }),
  }).then((r) => r.json()) as { accessToken: string };
  return verify.accessToken;
}

async function main() {
  const business = await prisma.business.findUnique({ where: { slug: 'qa-plan-premium' } });
  if (!business) throw new Error('qa-plan-premium not found — run seed');

  await prisma.business.update({
    where: { id: business.id },
    data: { planTier: BusinessPlanTier.PREMIUM, planExpiresAt: new Date('2099-01-01') },
  });

  const existingPhotos = await prisma.businessImage.count({ where: { businessId: business.id } });
  for (let i = existingPhotos; i < 40; i++) {
    await prisma.businessImage.create({
      data: {
        businessId: business.id,
        imageUrl: `https://images.unsplash.com/photo-1${i}?w=400`,
        sortOrder: i,
      },
    });
  }

  const existingItems = await prisma.serviceItem.count({ where: { businessId: business.id } });
  for (let i = existingItems; i < 40; i++) {
    await prisma.serviceItem.create({
      data: {
        businessId: business.id,
        title: `QA Item ${i}`,
        sortOrder: i,
        isActive: true,
      },
    });
  }

  const existingPromos = await prisma.promotion.count({
    where: { businessId: business.id, status: PromotionStatus.ACTIVE },
  });
  for (let i = existingPromos; i < 7; i++) {
    await prisma.promotion.create({
      data: {
        businessId: business.id,
        title: `QA Promo ${i}`,
        status: PromotionStatus.ACTIVE,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-30'),
      },
    });
  }

  const dbPhotos = await prisma.businessImage.count({ where: { businessId: business.id } });
  const dbItems = await prisma.serviceItem.count({ where: { businessId: business.id } });
  const dbPromos = await prisma.promotion.count({
    where: { businessId: business.id, status: PromotionStatus.ACTIVE },
  });
  const dbAnalytics = await prisma.analyticsEvent.count({ where: { businessId: business.id } });

  const token = await authOwner();
  await fetch(`${API}/businesses/${business.id}/plan/mock-checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'BASIC' }),
  });

  const publicDetail = await fetch(`${API}/businesses/${business.id}`).then((r) => r.json()) as {
    images: unknown[];
    promotions: unknown[];
    menu?: { groups: Array<{ items: unknown[] }>; ungrouped: unknown[] };
  };
  const ownerPlan = await fetch(`${API}/businesses/${business.id}/plan`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()) as {
    usage: { photos: number; serviceItems: number; activePromotions: number };
    entitlements: { photos: { total: number; published: number }; overLimitNotice: string | null };
  };
  const publicPromos = await fetch(`${API}/promotions?businessId=${business.id}`).then((r) => r.json()) as {
    items: unknown[];
  };
  const ownerPromos = await fetch(`${API}/promotions?businessId=${business.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()) as { items: unknown[] };

  const menuCount =
    (publicDetail.menu?.groups ?? []).reduce((n, g) => n + g.items.length, 0) +
    (publicDetail.menu?.ungrouped?.length ?? 0);

  const afterAnalytics = await prisma.analyticsEvent.count({ where: { businessId: business.id } });

  console.log(
    JSON.stringify(
      {
        phase: 'after_downgrade_to_basic',
        dbPhotos,
        dbItems,
        dbPromos,
        dbAnalyticsBefore: dbAnalytics,
        dbAnalyticsAfter: afterAnalytics,
        publicPhotos: publicDetail.images.length,
        publicPromos: publicPromos.items.length,
        publicMenuItems: menuCount,
        ownerUsage: ownerPlan.usage,
        ownerEntitlements: ownerPlan.entitlements,
        ownerPromos: ownerPromos.items.length,
        archivedPromos: await prisma.promotion.count({
          where: { businessId: business.id, status: PromotionStatus.DRAFT },
        }),
      },
      null,
      2,
    ),
  );

  await fetch(`${API}/businesses/${business.id}/plan/mock-checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'PREMIUM' }),
  });

  const upgradedPublic = await fetch(`${API}/businesses/${business.id}`).then((r) => r.json()) as {
    images: unknown[];
    promotions: unknown[];
  };

  console.log(
    JSON.stringify(
      {
        phase: 'after_upgrade_to_premium',
        publicPhotos: upgradedPublic.images.length,
        publicPromos: upgradedPublic.promotions.length,
        dbPhotos: await prisma.businessImage.count({ where: { businessId: business.id } }),
        activePromos: await prisma.promotion.count({
          where: { businessId: business.id, status: PromotionStatus.ACTIVE },
        }),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
