import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
  Prisma,
} from '@prisma/client';

type DbClient = Prisma.TransactionClient | { businessMembership: Prisma.TransactionClient['businessMembership'] };

/**
 * Active owners and managers with REVIEWS_REPLY who should receive review alerts.
 * Legacy ownerId is included when no active OWNER membership exists for the business.
 */
export async function resolveReviewNotificationRecipientUserIds(
  client: DbClient,
  businessId: string,
  options?: { excludeUserId?: string | null; legacyOwnerId?: string | null },
): Promise<string[]> {
  const memberships = await client.businessMembership.findMany({
    where: {
      businessId,
      status: BusinessMembershipStatus.ACTIVE,
      OR: [
        { role: BusinessMembershipRole.OWNER },
        {
          role: BusinessMembershipRole.MANAGER,
          permissions: { has: BusinessPermission.REVIEWS_REPLY },
        },
      ],
    },
    select: { userId: true, role: true },
  });

  const recipientIds = new Set(memberships.map((m) => m.userId));

  const hasActiveOwnerMember = memberships.some((m) => m.role === BusinessMembershipRole.OWNER);
  const legacyOwnerId = options?.legacyOwnerId?.trim();
  if (legacyOwnerId && !hasActiveOwnerMember) {
    recipientIds.add(legacyOwnerId);
  }

  const exclude = options?.excludeUserId?.trim();
  if (exclude) {
    recipientIds.delete(exclude);
  }

  return [...recipientIds];
}
