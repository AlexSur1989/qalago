/**
 * DEV ONLY — creates one structured NEW_REVIEW notification for physical navigation QA.
 *
 * Usage (from services/catalog-api, with local .env):
 *   set NOTIFICATION_FIXTURE_USER_PHONE=+77000000002
 *   node scripts/dev/seed-notification-navigation-fixture.mjs
 *
 * Or:
 *   set NOTIFICATION_FIXTURE_USER_ID=<User.id cuid — not Business.id>
 *
 * Optional overrides:
 *   NOTIFICATION_FIXTURE_BUSINESS_ID, NOTIFICATION_FIXTURE_REVIEW_ID
 *
 * When review/business ids are omitted, picks a real ACTIVE business review from DB.
 * Does not modify reviews or historical notifications.
 */
import { NotificationTargetType, NotificationType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveRealReviewPair(businessIdOverride, reviewIdOverride) {
  if (reviewIdOverride) {
    const review = await prisma.review.findUnique({
      where: { id: reviewIdOverride },
      select: {
        id: true,
        businessId: true,
        deletedAt: true,
        business: { select: { id: true, title: true, ownerId: true, status: true } },
      },
    });
    if (!review || review.deletedAt) {
      throw new Error(`Review not found or deleted: ${reviewIdOverride}`);
    }
    if (businessIdOverride && review.businessId !== businessIdOverride) {
      throw new Error('NOTIFICATION_FIXTURE_REVIEW_ID does not belong to NOTIFICATION_FIXTURE_BUSINESS_ID');
    }
    return { reviewId: review.id, businessId: review.businessId, business: review.business };
  }

  const review = await prisma.review.findFirst({
    where: {
      deletedAt: null,
      moderationHidden: false,
      ...(businessIdOverride ? { businessId: businessIdOverride } : {}),
      business: { status: 'ACTIVE' },
    },
    select: {
      id: true,
      businessId: true,
      business: { select: { id: true, title: true, ownerId: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!review) {
    throw new Error('No suitable public review found; create a review or set NOTIFICATION_FIXTURE_REVIEW_ID.');
  }

  return { reviewId: review.id, businessId: review.businessId, business: review.business };
}

async function resolveFixtureRecipientUser(businessIdOverride) {
  const userIdOverride = process.env.NOTIFICATION_FIXTURE_USER_ID?.trim();
  const phoneOverride = process.env.NOTIFICATION_FIXTURE_USER_PHONE?.trim();

  if (userIdOverride) {
    const user = await prisma.user.findUnique({
      where: { id: userIdOverride },
      select: { id: true, phone: true, name: true, role: true },
    });
    if (!user) {
      const business = await prisma.business.findUnique({
        where: { id: userIdOverride },
        select: { id: true, title: true },
      });
      if (business) {
        console.error(
          `NOTIFICATION_FIXTURE_USER_ID=${userIdOverride} is a Business.id (${business.title}), not User.id. ` +
            'Use NOTIFICATION_FIXTURE_USER_PHONE=+77000000002 or GET /api/v1/users/me after mobile login.',
        );
      } else {
        console.error(`User not found: ${userIdOverride}`);
      }
      process.exit(1);
    }
    return user;
  }

  if (phoneOverride) {
    const user = await prisma.user.findUnique({
      where: { phone: phoneOverride },
      select: { id: true, phone: true, name: true, role: true },
    });
    if (!user) {
      console.error(`User not found for phone: ${phoneOverride}`);
      process.exit(1);
    }
    return user;
  }

  if (businessIdOverride) {
    const business = await prisma.business.findUnique({
      where: { id: businessIdOverride },
      select: {
        id: true,
        title: true,
        ownerId: true,
        owner: { select: { id: true, phone: true, name: true, role: true } },
      },
    });
    if (!business?.owner) {
      console.error(
        `Business not found or has no owner: ${businessIdOverride ?? '(none)'}. ` +
          'Set NOTIFICATION_FIXTURE_USER_PHONE or NOTIFICATION_FIXTURE_USER_ID.',
      );
      process.exit(1);
    }
    return business.owner;
  }

  console.error(
    'Set NOTIFICATION_FIXTURE_USER_PHONE (e.g. +77000000002) or NOTIFICATION_FIXTURE_USER_ID (User.id from /users/me).',
  );
  process.exit(1);
}

async function main() {
  const businessIdOverride = process.env.NOTIFICATION_FIXTURE_BUSINESS_ID?.trim() || undefined;
  const reviewIdOverride = process.env.NOTIFICATION_FIXTURE_REVIEW_ID?.trim() || undefined;

  const user = await resolveFixtureRecipientUser(businessIdOverride);

  const { reviewId, businessId, business } = await resolveRealReviewPair(
    businessIdOverride,
    reviewIdOverride,
  );

  const row = await prisma.notification.create({
    data: {
      userId: user.id,
      type: NotificationType.NEW_REVIEW,
      title: '[DEV FIXTURE] New review',
      body: `Navigation QA — ${business.title}`,
      targetType: NotificationTargetType.REVIEW,
      targetId: reviewId,
      payload: { businessId, reviewId },
      isRead: false,
    },
  });

  console.log(
    JSON.stringify(
      {
        fixture: 'FIXTURE CREATED',
        notificationId: row.id,
        notificationType: row.type,
        targetType: row.targetType,
        targetId: row.targetId,
        businessId,
        reviewId,
        recipientUserId: user.id,
        recipient: user,
        businessTitle: business.title,
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
  .finally(() => prisma.$disconnect());
