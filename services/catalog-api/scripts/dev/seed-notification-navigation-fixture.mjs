/**
 * DEV ONLY — creates one structured NEW_REVIEW notification for physical navigation QA.
 *
 * Usage (from services/catalog-api, with local .env):
 *   set NOTIFICATION_FIXTURE_USER_ID=<cuid>
 *   node scripts/dev/seed-notification-navigation-fixture.mjs
 *
 * Optional:
 *   NOTIFICATION_FIXTURE_BUSINESS_ID, NOTIFICATION_FIXTURE_REVIEW_ID
 *
 * Does not modify reviews or seed data. Safe to delete row by id from stdout.
 */
import { NotificationTargetType, NotificationType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.NOTIFICATION_FIXTURE_USER_ID?.trim();
  if (!userId) {
    console.error('Set NOTIFICATION_FIXTURE_USER_ID to the logged-in test user id.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    console.error(`User not found: ${userId}`);
    process.exit(1);
  }

  const businessId =
    process.env.NOTIFICATION_FIXTURE_BUSINESS_ID?.trim() ??
    (
      await prisma.business.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true },
      })
    )?.id;

  if (!businessId) {
    console.error('No business id available; set NOTIFICATION_FIXTURE_BUSINESS_ID.');
    process.exit(1);
  }

  const reviewId = process.env.NOTIFICATION_FIXTURE_REVIEW_ID?.trim() ?? `fixture-review-${Date.now()}`;

  const row = await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.NEW_REVIEW,
      title: '[DEV FIXTURE] New review',
      body: 'Navigation QA fixture — safe to delete',
      targetType: NotificationTargetType.REVIEW,
      targetId: reviewId,
      payload: { businessId, reviewId },
      isRead: false,
    },
  });

  console.log(JSON.stringify({ created: row.id, userId, businessId, reviewId }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
