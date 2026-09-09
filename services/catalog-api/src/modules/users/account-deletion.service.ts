import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessApplicationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessOwnershipClaimStatus,
  BusinessInvitationStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export type AccountDeletionResult = {
  success: true;
  message: string;
};

@Injectable()
export class AccountDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteOwnAccount(userId: string): Promise<AccountDeletionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        isActive: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive && user.phone.startsWith('deleted:')) {
      return {
        success: true,
        message: 'Account already deleted',
      };
    }

    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.CITY_ADMIN
    ) {
      throw new ConflictException(
        'Невозможно удалить аккаунт администратора через приложение. Обратитесь в поддержку.',
      );
    }

    const soleOwnerBusinessIds = await this.findSoleOwnerBusinessIds(userId);
    if (soleOwnerBusinessIds.length > 0) {
      throw new ConflictException(
        'Перед удалением аккаунта передайте управление заведением другому владельцу или обратитесь в поддержку.',
      );
    }

    const anonymizedPhone = `deleted:${userId}:${Date.now()}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.otpCode.deleteMany({ where: { phone: user.phone } });

      await tx.businessMembership.updateMany({
        where: { userId, status: BusinessMembershipStatus.ACTIVE },
        data: { status: BusinessMembershipStatus.REVOKED },
      });

      await tx.businessApplication.updateMany({
        where: {
          applicantUserId: userId,
          status: { in: [BusinessApplicationStatus.DRAFT, BusinessApplicationStatus.PENDING] },
        },
        data: { status: BusinessApplicationStatus.CANCELLED },
      });

      await tx.businessOwnershipClaim.updateMany({
        where: {
          claimantUserId: userId,
          status: BusinessOwnershipClaimStatus.PENDING,
        },
        data: { status: BusinessOwnershipClaimStatus.CANCELLED },
      });

      await tx.businessInvitation.updateMany({
        where: {
          invitedByUserId: userId,
          status: BusinessInvitationStatus.PENDING,
        },
        data: { status: BusinessInvitationStatus.REVOKED },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          phone: anonymizedPhone,
          name: null,
          preferredCityId: null,
        },
      });
    });

    return {
      success: true,
      message: 'Аккаунт удалён',
    };
  }

  private async findSoleOwnerBusinessIds(userId: string): Promise<string[]> {
    const soleOwned = new Set<string>();

    const ownerMemberships = await this.prisma.businessMembership.findMany({
      where: {
        userId,
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      },
      select: { businessId: true },
    });

    for (const row of ownerMemberships) {
      const ownerCount = await this.prisma.businessMembership.count({
        where: {
          businessId: row.businessId,
          role: BusinessMembershipRole.OWNER,
          status: BusinessMembershipStatus.ACTIVE,
        },
      });
      if (ownerCount <= 1) {
        soleOwned.add(row.businessId);
      }
    }

    const legacyBusinesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    for (const business of legacyBusinesses) {
      if (soleOwned.has(business.id)) continue;

      const activeOwners = await this.prisma.businessMembership.count({
        where: {
          businessId: business.id,
          role: BusinessMembershipRole.OWNER,
          status: BusinessMembershipStatus.ACTIVE,
        },
      });

      if (activeOwners === 0) {
        soleOwned.add(business.id);
        continue;
      }

      const otherOwners = await this.prisma.businessMembership.count({
        where: {
          businessId: business.id,
          role: BusinessMembershipRole.OWNER,
          status: BusinessMembershipStatus.ACTIVE,
          userId: { not: userId },
        },
      });
      if (otherOwners === 0) {
        soleOwned.add(business.id);
      }
    }

    return [...soleOwned];
  }
}
