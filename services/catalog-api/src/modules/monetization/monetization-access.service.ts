import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessPermission, UserRole } from '@prisma/client';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MonetizationErrorCode,
  monetizationForbidden,
  monetizationNotFound,
} from './errors/monetization.errors';

@Injectable()
export class MonetizationAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async assertBusinessOwner(user: AuthUser, businessId: string) {
    try {
      return await this.businessAccess.assertOwner(user, businessId);
    } catch (err) {
      if (err instanceof NotFoundException) {
        monetizationNotFound(
          MonetizationErrorCode.PRODUCT_NOT_FOUND,
          'Business not found',
        );
      }
      monetizationForbidden(
        MonetizationErrorCode.BUSINESS_NOT_OWNED,
        'Not business owner',
      );
    }
  }

  async assertCanManageBusiness(user: AuthUser, businessId: string) {
    try {
      return await this.businessAccess.assertBusinessPermission(
        user,
        businessId,
        BusinessPermission.ADS_MANAGE,
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        monetizationNotFound(
          MonetizationErrorCode.PRODUCT_NOT_FOUND,
          'Business not found',
        );
      }
      monetizationForbidden(
        MonetizationErrorCode.BUSINESS_NOT_OWNED,
        'Not allowed to manage ads for this business',
      );
    }
  }

  private async assertBusinessSideAccess(user: AuthUser, businessId: string) {
    try {
      const access = await this.businessAccess.resolveAccess(user, businessId);
      if (
        access.accessRole === 'OWNER' ||
        access.accessRole === 'ADMIN' ||
        access.accessRole === 'CITY_ADMIN' ||
        access.permissions.includes(BusinessPermission.ADS_MANAGE) ||
        access.permissions.includes(BusinessPermission.PAYMENTS_VIEW)
      ) {
        return access.business;
      }
      throw new ForbiddenException('Not allowed');
    } catch (err) {
      if (err instanceof NotFoundException) {
        monetizationNotFound(
          MonetizationErrorCode.PRODUCT_NOT_FOUND,
          'Business not found',
        );
      }
      monetizationForbidden(
        MonetizationErrorCode.BUSINESS_NOT_OWNED,
        'Not allowed to access this business monetization',
      );
    }
  }

  async assertOrderAccess(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        business: { select: { id: true, ownerId: true, cityId: true } },
        items: { include: { product: true } },
        payments: true,
      },
    });
    if (!order) {
      monetizationNotFound(
        MonetizationErrorCode.ORDER_NOT_FOUND,
        'Order not found',
      );
    }

    if (user.role === UserRole.ADMIN) {
      return order;
    }

    if (user.role === UserRole.CITY_ADMIN) {
      await this.cityScope.assertBusinessInAdminScope(user, order.business.cityId);
      return order;
    }

    await this.assertBusinessSideAccess(user, order.business.id);
    return order;
  }

  async assertCampaignAccess(user: AuthUser, campaignId: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: {
        business: { select: { id: true, ownerId: true, cityId: true, title: true } },
        product: true,
        creative: true,
        orderItem: { select: { metadata: true } },
        campaignPlacements: { include: { placement: true } },
      },
    });
    if (!campaign) {
      monetizationNotFound(
        MonetizationErrorCode.CAMPAIGN_NOT_FOUND,
        'Campaign not found',
      );
    }

    if (user.role === UserRole.ADMIN) {
      return campaign;
    }

    if (user.role === UserRole.CITY_ADMIN) {
      await this.cityScope.assertBusinessInAdminScope(user, campaign.business.cityId);
      return campaign;
    }

    try {
      await this.businessAccess.assertBusinessPermission(
        user,
        campaign.business.id,
        BusinessPermission.ADS_MANAGE,
      );
    } catch {
      monetizationForbidden(
        MonetizationErrorCode.BUSINESS_NOT_OWNED,
        'Not allowed to access this campaign',
      );
    }

    return campaign;
  }

  async assertCreativeAccess(user: AuthUser, creativeId: string) {
    const creative = await this.prisma.adCreative.findUnique({
      where: { id: creativeId },
      include: { business: { select: { id: true, ownerId: true, cityId: true } } },
    });
    if (!creative) {
      monetizationNotFound(
        MonetizationErrorCode.CREATIVE_NOT_FOUND,
        'Creative not found',
      );
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      if (user.role === UserRole.CITY_ADMIN) {
        await this.cityScope.assertBusinessInAdminScope(
          user,
          creative.business.cityId,
        );
      }
      return creative;
    }

    try {
      await this.businessAccess.assertBusinessPermission(
        user,
        creative.business.id,
        BusinessPermission.ADS_MANAGE,
      );
    } catch {
      monetizationForbidden(
        MonetizationErrorCode.CREATIVE_NOT_OWNED,
        'Not allowed to access this creative',
      );
    }

    return creative;
  }

  async assertAdminPaymentAccess(user: AuthUser, paymentId: string) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.CITY_ADMIN) {
      monetizationForbidden(
        MonetizationErrorCode.BUSINESS_NOT_OWNED,
        'Admin only',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            business: { select: { cityId: true } },
          },
        },
      },
    });
    if (!payment) {
      monetizationNotFound(
        MonetizationErrorCode.PAYMENT_NOT_FOUND,
        'Payment not found',
      );
    }

    if (user.role === UserRole.CITY_ADMIN) {
      await this.cityScope.assertBusinessInAdminScope(
        user,
        payment.order.business.cityId,
      );
    }

    return payment;
  }

  async resolveAdminCityFilter(user: AuthUser, citySlug?: string) {
    return this.cityScope.resolveAdminCityId(user, citySlug);
  }
}
