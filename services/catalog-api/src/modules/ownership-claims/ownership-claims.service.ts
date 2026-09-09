import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessOwnershipClaimStatus,
  BusinessOwnershipClaimVerificationMethod,
  BusinessStatus,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { OnboardingRateLimitService } from '../../common/services/onboarding-rate-limit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AdminListOwnershipClaimsQueryDto,
  CreateOwnershipClaimDto,
  ListMyOwnershipClaimsQueryDto,
  RejectOwnershipClaimDto,
} from './dto/ownership-claim.dto';

const businessSummarySelect = {
  id: true,
  title: true,
  address: true,
  status: true,
  cityId: true,
  city: { select: { id: true, slug: true, nameRu: true } },
} satisfies Prisma.BusinessSelect;

const claimInclude = {
  business: { select: businessSummarySelect },
} satisfies Prisma.BusinessOwnershipClaimInclude;

const adminClaimInclude = {
  ...claimInclude,
  claimant: { select: { id: true, name: true, role: true } },
  reviewedBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.BusinessOwnershipClaimInclude;

@Injectable()
export class OwnershipClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly membership: BusinessMembershipService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
    private readonly rateLimit: OnboardingRateLimitService,
  ) {}

  async create(user: AuthUser, businessId: string, dto: CreateOwnershipClaimDto) {
    this.rateLimit.assertOwnershipClaimCreate(user.id);

    const business = await this.loadBusinessForClaim(businessId);
    await this.assertCanClaim(user.id, business);

    const claimantMessage = dto.claimantMessage?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      await this.assertNoPendingClaim(tx, businessId, user.id);

      const claim = await tx.businessOwnershipClaim.create({
        data: {
          businessId,
          claimantUserId: user.id,
          status: BusinessOwnershipClaimStatus.PENDING,
          verificationMethod: BusinessOwnershipClaimVerificationMethod.MANUAL,
          claimantMessage,
        },
        include: claimInclude,
      });

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_SUBMIT,
        resourceType: AuditResourceType.BUSINESS_OWNERSHIP_CLAIM,
        resourceId: claim.id,
        businessId,
        cityId: business.cityId,
        targetUserId: user.id,
        metadata: {
          claimId: claim.id,
          businessId,
          oldStatus: null,
          newStatus: BusinessOwnershipClaimStatus.PENDING,
          verificationMethod: BusinessOwnershipClaimVerificationMethod.MANUAL,
        },
        tx,
      });

      return claim;
    });
  }

  async listMine(user: AuthUser, query: ListMyOwnershipClaimsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessOwnershipClaimWhereInput = {
      claimantUserId: user.id,
    };

    const [items, total] = await Promise.all([
      this.prisma.businessOwnershipClaim.findMany({
        where,
        include: claimInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.businessOwnershipClaim.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async getOwn(user: AuthUser, id: string) {
    const claim = await this.prisma.businessOwnershipClaim.findUnique({
      where: { id },
      include: claimInclude,
    });
    if (!claim || claim.claimantUserId !== user.id) {
      throw new NotFoundException('Claim not found');
    }
    return claim;
  }

  async cancel(user: AuthUser, id: string) {
    const claim = await this.getOwn(user, id);
    if (claim.status !== BusinessOwnershipClaimStatus.PENDING) {
      throw new BadRequestException('Only PENDING claims can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.businessOwnershipClaim.updateMany({
        where: { id, status: BusinessOwnershipClaimStatus.PENDING },
        data: { status: BusinessOwnershipClaimStatus.CANCELLED },
      });
      if (result.count !== 1) {
        throw new ConflictException('Claim is no longer pending');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_CANCEL,
        resourceType: AuditResourceType.BUSINESS_OWNERSHIP_CLAIM,
        resourceId: id,
        businessId: claim.businessId,
        cityId: claim.business.cityId,
        targetUserId: user.id,
        metadata: {
          claimId: id,
          businessId: claim.businessId,
          oldStatus: BusinessOwnershipClaimStatus.PENDING,
          newStatus: BusinessOwnershipClaimStatus.CANCELLED,
        },
        tx,
      });

      return tx.businessOwnershipClaim.findUniqueOrThrow({
        where: { id },
        include: claimInclude,
      });
    });
  }

  async adminList(user: AuthUser, query: AdminListOwnershipClaimsQueryDto) {
    this.assertModerator(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BusinessOwnershipClaimWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.businessId) where.businessId = query.businessId;

    const scopedCityId = await this.resolveAdminCityFilter(user, query);
    if (scopedCityId) {
      where.business = { cityId: scopedCityId };
    }

    const [items, total] = await Promise.all([
      this.prisma.businessOwnershipClaim.findMany({
        where,
        include: adminClaimInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.businessOwnershipClaim.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async adminGet(user: AuthUser, id: string) {
    this.assertModerator(user);
    const claim = await this.prisma.businessOwnershipClaim.findUnique({
      where: { id },
      include: adminClaimInclude,
    });
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }
    await this.cityScope.assertBusinessInAdminScope(user, claim.business.cityId);
    return claim;
  }

  async adminReject(user: AuthUser, id: string, dto: RejectOwnershipClaimDto) {
    this.assertModerator(user);
    const claim = await this.adminGet(user, id);
    if (claim.status !== BusinessOwnershipClaimStatus.PENDING) {
      throw new BadRequestException('Only PENDING claims can be rejected');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.businessOwnershipClaim.updateMany({
        where: { id, status: BusinessOwnershipClaimStatus.PENDING },
        data: {
          status: BusinessOwnershipClaimStatus.REJECTED,
          rejectionReason: dto.rejectionReason.trim(),
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
        },
      });
      if (result.count !== 1) {
        throw new ConflictException('Claim is no longer pending');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_REJECT,
        resourceType: AuditResourceType.BUSINESS_OWNERSHIP_CLAIM,
        resourceId: id,
        businessId: claim.businessId,
        cityId: claim.business.cityId,
        targetUserId: claim.claimantUserId,
        metadata: {
          claimId: id,
          businessId: claim.businessId,
          oldStatus: BusinessOwnershipClaimStatus.PENDING,
          newStatus: BusinessOwnershipClaimStatus.REJECTED,
          verificationMethod: claim.verificationMethod,
        },
        tx,
      });

      const updated = await tx.businessOwnershipClaim.findUniqueOrThrow({
        where: { id },
        include: adminClaimInclude,
      });

      await this.notifications.create({
        userId: claim.claimantUserId,
        type: NotificationType.GENERAL,
        title: 'Заявка на владение отклонена',
        body: dto.rejectionReason.trim(),
      });

      return updated;
    });
  }

  async adminApprove(user: AuthUser, id: string) {
    this.assertModerator(user);
    const claim = await this.adminGet(user, id);

    if (claim.status === BusinessOwnershipClaimStatus.APPROVED) {
      return { claim, business: claim.business };
    }

    if (claim.status !== BusinessOwnershipClaimStatus.PENDING) {
      throw new BadRequestException('Only PENDING claims can be approved');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.businessOwnershipClaim.findUnique({
        where: { id },
        include: { business: true },
      });
      if (!locked || locked.status !== BusinessOwnershipClaimStatus.PENDING) {
        throw new ConflictException('Claim is no longer pending');
      }

      const businessBefore = locked.business;
      const planTierBefore = businessBefore.planTier;

      await this.assertCanApproveClaim(
        locked.claimantUserId,
        businessBefore,
        tx,
      );

      await this.grantOwnerMembership(tx, locked.claimantUserId, businessBefore.id);

      if (businessBefore.ownerId == null) {
        await tx.business.update({
          where: { id: businessBefore.id },
          data: { ownerId: locked.claimantUserId },
        });
      }

      const approveResult = await tx.businessOwnershipClaim.updateMany({
        where: { id, status: BusinessOwnershipClaimStatus.PENDING },
        data: {
          status: BusinessOwnershipClaimStatus.APPROVED,
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      if (approveResult.count !== 1) {
        throw new ConflictException('Claim approval race detected');
      }

      await this.auditLog.record({
        actor: user,
        action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_APPROVE,
        resourceType: AuditResourceType.BUSINESS_OWNERSHIP_CLAIM,
        resourceId: id,
        businessId: businessBefore.id,
        cityId: businessBefore.cityId,
        targetUserId: locked.claimantUserId,
        metadata: {
          claimId: id,
          businessId: businessBefore.id,
          oldStatus: BusinessOwnershipClaimStatus.PENDING,
          newStatus: BusinessOwnershipClaimStatus.APPROVED,
          verificationMethod: locked.verificationMethod,
        },
        tx,
      });

      const businessAfter = await tx.business.findUniqueOrThrow({
        where: { id: businessBefore.id },
        select: {
          ...businessSummarySelect,
          ownerId: true,
          planTier: true,
          title: true,
          categoryId: true,
          phone: true,
          shortDesc: true,
        },
      });

      if (businessAfter.planTier !== planTierBefore) {
        throw new ConflictException('Business plan must not change on claim approval');
      }

      const updatedClaim = await tx.businessOwnershipClaim.findUniqueOrThrow({
        where: { id },
        include: adminClaimInclude,
      });

      await this.notifications.create({
        userId: locked.claimantUserId,
        type: NotificationType.GENERAL,
        title: 'Заявка на владение одобрена',
        body: `Вам предоставлен доступ владельца к «${businessAfter.title}».`,
      });

      return { claim: updatedClaim, business: businessAfter };
    });
  }

  /** Centralized eligibility for claim submission (Stage 5N.2). */
  async assertCanClaim(
    userId: string,
    business: { id: string; status: BusinessStatus; ownerId: string | null; cityId: string },
  ) {
    if (business.status !== BusinessStatus.ACTIVE) {
      throw new BadRequestException('Ownership claims are only allowed for active businesses');
    }

    const membership = await this.membership.getMembership(userId, business.id);

    if (membership) {
      if (
        membership.role === BusinessMembershipRole.OWNER &&
        membership.status === BusinessMembershipStatus.ACTIVE
      ) {
        throw new ConflictException('You are already an active owner of this business');
      }
      if (
        membership.role === BusinessMembershipRole.OWNER &&
        (membership.status === BusinessMembershipStatus.SUSPENDED ||
          membership.status === BusinessMembershipStatus.REVOKED)
      ) {
        throw new ForbiddenException(
          'Owner access was suspended or revoked; contact platform support',
        );
      }
      if (
        membership.role === BusinessMembershipRole.MANAGER &&
        (membership.status === BusinessMembershipStatus.SUSPENDED ||
          membership.status === BusinessMembershipStatus.REVOKED)
      ) {
        throw new ForbiddenException(
          'Manager access was suspended or revoked; contact platform support',
        );
      }
      if (membership.status === BusinessMembershipStatus.INVITED) {
        throw new BadRequestException('Accept or decline your team invitation first');
      }
      // ACTIVE MANAGER may submit a claim
    } else if (business.ownerId === userId) {
      throw new ConflictException('You already have legacy owner access to this business');
    }
  }

  private async assertCanApproveClaim(
    claimantUserId: string,
    business: { id: string; ownerId: string | null },
    tx: Prisma.TransactionClient,
  ) {
    const membership = await tx.businessMembership.findUnique({
      where: { userId_businessId: { userId: claimantUserId, businessId: business.id } },
    });

    if (membership) {
      if (
        membership.role === BusinessMembershipRole.OWNER &&
        membership.status === BusinessMembershipStatus.ACTIVE
      ) {
        throw new ConflictException('Claimant is already an active owner');
      }
      if (
        membership.status === BusinessMembershipStatus.SUSPENDED ||
        membership.status === BusinessMembershipStatus.REVOKED
      ) {
        throw new ForbiddenException(
          'Cannot approve claim for suspended or revoked membership',
        );
      }
      if (membership.status === BusinessMembershipStatus.INVITED) {
        throw new BadRequestException('Claimant must resolve team invitation first');
      }
    } else if (business.ownerId === claimantUserId) {
      throw new ConflictException('Claimant already has legacy owner access');
    }
  }

  private async grantOwnerMembership(
    tx: Prisma.TransactionClient,
    userId: string,
    businessId: string,
  ) {
    const existing = await tx.businessMembership.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });

    if (!existing) {
      await this.membership.createActiveOwnerMembership(tx, userId, businessId);
      return;
    }

    if (
      existing.role === BusinessMembershipRole.MANAGER &&
      existing.status === BusinessMembershipStatus.ACTIVE
    ) {
      await tx.businessMembership.update({
        where: { userId_businessId: { userId, businessId } },
        data: {
          role: BusinessMembershipRole.OWNER,
          status: BusinessMembershipStatus.ACTIVE,
          permissions: [],
        },
      });
      return;
    }

    throw new ConflictException('Unexpected membership state for ownership grant');
  }

  private async assertNoPendingClaim(
    tx: Prisma.TransactionClient,
    businessId: string,
    claimantUserId: string,
  ) {
    const pending = await tx.businessOwnershipClaim.findFirst({
      where: {
        businessId,
        claimantUserId,
        status: BusinessOwnershipClaimStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('You already have a pending claim for this business');
    }
  }

  private async loadBusinessForClaim(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        status: true,
        ownerId: true,
        cityId: true,
        planTier: true,
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  private assertModerator(user: AuthUser) {
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.CITY_ADMIN
    ) {
      throw new ForbiddenException('Moderator access required');
    }
  }

  private async resolveAdminCityFilter(
    user: AuthUser,
    query: AdminListOwnershipClaimsQueryDto,
  ): Promise<string | undefined> {
    if (user.role === UserRole.CITY_ADMIN) {
      const managed = await this.cityScope.resolveAdminCityId(user);
      if (query.cityId && query.cityId !== managed) {
        throw new ForbiddenException('Not allowed to filter claims in this city');
      }
      if (query.citySlug) {
        const requested = await this.cityScope.resolveCityId({ citySlug: query.citySlug });
        if (requested !== managed) {
          throw new ForbiddenException('Not allowed to filter claims in this city');
        }
      }
      return managed;
    }

    if (query.cityId) return query.cityId;
    if (query.citySlug) return this.cityScope.resolveCityId({ citySlug: query.citySlug });
    return undefined;
  }
}
