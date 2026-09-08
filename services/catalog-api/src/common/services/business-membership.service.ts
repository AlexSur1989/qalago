import { Injectable } from '@nestjs/common';
import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type BusinessMembershipRecord = {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessMembershipRole;
  status: BusinessMembershipStatus;
};

/**
 * Stage 5M.1 — business-scoped identity (OWNER/MANAGER memberships).
 * Authorization remains primarily in BusinessAccessService.
 */
@Injectable()
export class BusinessMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  getMembership(userId: string, businessId: string) {
    return this.prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });
  }

  getActiveMembership(userId: string, businessId: string) {
    return this.prisma.businessMembership.findFirst({
      where: {
        userId,
        businessId,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });
  }

  async isActiveOwner(userId: string, businessId: string): Promise<boolean> {
    const membership = await this.getActiveMembership(userId, businessId);
    return membership?.role === BusinessMembershipRole.OWNER;
  }

  /**
   * Dual-read owner access during migration (Stage 5M.1).
   * Legacy ownerId OR ACTIVE OWNER membership.
   * MANAGER never grants access in 5M.1.
   */
  async hasActiveOwnerAccess(
    userId: string,
    businessId: string,
    legacyOwnerId?: string | null,
  ): Promise<boolean> {
    if (legacyOwnerId != null && legacyOwnerId === userId) {
      return true;
    }
    return this.isActiveOwner(userId, businessId);
  }

  listOwnerBusinessIds(userId: string) {
    return this.prisma.businessMembership.findMany({
      where: {
        userId,
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
      select: { businessId: true },
    });
  }

  async createActiveOwnerMembership(
    tx: Prisma.TransactionClient,
    userId: string,
    businessId: string,
  ) {
    return tx.businessMembership.upsert({
      where: { userId_businessId: { userId, businessId } },
      create: {
        userId,
        businessId,
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
      update: {
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });
  }
}
