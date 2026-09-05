import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
  ) {}

  async assertBusinessOwner(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, cityId: true, categoryId: true },
    });
    if (!business) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Business not found',
      );
    }

    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CITY_ADMIN ||
      business.ownerId === user.id
    ) {
      return business;
    }

    monetizationForbidden(
      MonetizationErrorCode.BUSINESS_NOT_OWNED,
      'Not business owner',
    );
  }

  async assertCanManageBusiness(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, cityId: true, categoryId: true },
    });
    if (!business) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Business not found',
      );
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      return business;
    }
    if (user.role === UserRole.BUSINESS && business.ownerId === user.id) {
      return business;
    }

    monetizationForbidden(
      MonetizationErrorCode.BUSINESS_NOT_OWNED,
      'Not business owner',
    );
  }

  async assertOrderAccess(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        business: { select: { ownerId: true, cityId: true } },
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

    if (order.business.ownerId === user.id) {
      return order;
    }

    monetizationForbidden(
      MonetizationErrorCode.BUSINESS_NOT_OWNED,
      'Not allowed to access this order',
    );
  }

  async assertCampaignAccess(user: AuthUser, campaignId: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: {
        business: { select: { ownerId: true, cityId: true } },
        product: true,
        creative: true,
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

    if (campaign.business.ownerId === user.id) {
      return campaign;
    }

    monetizationForbidden(
      MonetizationErrorCode.BUSINESS_NOT_OWNED,
      'Not allowed to access this campaign',
    );
  }

  async assertCreativeAccess(user: AuthUser, creativeId: string) {
    const creative = await this.prisma.adCreative.findUnique({
      where: { id: creativeId },
      include: { business: { select: { ownerId: true, cityId: true } } },
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

    if (creative.business.ownerId === user.id) {
      return creative;
    }

    monetizationForbidden(
      MonetizationErrorCode.CREATIVE_NOT_OWNED,
      'Not allowed to access this creative',
    );
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
