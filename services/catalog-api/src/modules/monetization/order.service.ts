import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  MonetizationProductType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { PACKAGE_PRODUCT_CODE } from './constants/monetization.constants';
import { CreateOrderDto, CreateOrderItemDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  PurchaseConflictReason,
  PurchaseConflictReasonType,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import {
  PurchaseIntent,
  buildPackagePurchaseIntent,
  buildProductPurchaseIntent,
} from './utils/purchase-intent.util';
import { calcDiscountAmount, sumFinalPrices } from './utils/money.util';
import { generateUniqueOrderNumber } from './utils/order-number.util';

type PricedOrderLine = {
  productId: string;
  productCode: string;
  productType: MonetizationProductType;
  quantity: number;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  durationHours?: number | null;
  durationDays?: number | null;
  metadata: Record<string, unknown>;
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
    private readonly pricing: PricingService,
    private readonly availability: AvailabilityService,
    private readonly provisioning: CampaignProvisioningService,
    private readonly auditLog: AuditLogService,
    private readonly purchaseIntegrity: PurchaseIntegrityService,
  ) {}

  async createOrder(user: AuthUser, dto: CreateOrderDto) {
    const business = await this.access.assertCanManageBusiness(user, dto.businessId);

    if (dto.packageCode) {
      return this.createPackageOrder(user, dto, business);
    }

    if (!dto.items?.length) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_DURATION,
        'items or packageCode required',
      );
    }

    const lines = await this.buildProductLines(dto.businessId, business, dto.items!);
    const intent =
      dto.items!.length === 1
        ? buildProductPurchaseIntent({
            businessId: dto.businessId,
            productCode: dto.items![0].productCode,
            durationHours: dto.items![0].durationHours,
            durationDays: dto.items![0].durationDays,
            categoryId:
              dto.items![0].categoryId ?? business.categoryId,
            promotionId: dto.items![0].promotionId,
            creativeId: dto.items![0].creativeId,
            desiredStartAt: dto.items![0].desiredStartAt,
          })
        : undefined;
    return this.persistOrder(user, dto.businessId, lines, {
      intent,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  private async createPackageOrder(
    user: AuthUser,
    dto: CreateOrderDto,
    business: { cityId: string; categoryId: string },
  ) {
    const pkg = await this.prisma.promotionPackage.findUnique({
      where: { code: dto.packageCode! },
      include: { items: { include: { product: true } } },
    });
    if (!pkg || !pkg.isActive || pkg.price == null) {
      monetizationNotFound(
        MonetizationErrorCode.PACKAGE_NOT_FOUND,
        'Package not found',
      );
    }

    const packageProduct = await this.prisma.monetizationProduct.findUnique({
      where: { code: PACKAGE_PRODUCT_CODE },
    });
    if (!packageProduct) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Package product not configured',
      );
    }

    const hasPromotedPromotion = pkg!.items.some(
      (item) => item.product.type === MonetizationProductType.PROMOTED_PROMOTION,
    );
    if (hasPromotedPromotion && !dto.promotionId) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'promotionId required for package with PROMOTED_PROMOTION',
      );
    }
    if (dto.promotionId) {
      await this.purchaseIntegrity.assertPromotionEligible(
        dto.businessId,
        dto.promotionId,
      );
    }

    const hasVipBanner = pkg!.items.some(
      (item) => item.product.type === MonetizationProductType.VIP_BANNER,
    );
    if (hasVipBanner) {
      await this.assertOwnedVipCreative(dto.businessId, dto.creativeId);
    }

    const discountPercent = this.pricing.packageDiscountPercent();
    const basePrice = pkg!.price!;
    const discountAmount = calcDiscountAmount(basePrice, discountPercent);
    const finalPrice = basePrice - discountAmount;

    const lines: PricedOrderLine[] = [
      {
        productId: packageProduct!.id,
        productCode: PACKAGE_PRODUCT_CODE,
        productType: MonetizationProductType.PACKAGE,
        quantity: 1,
        basePrice,
        discountPercent,
        discountAmount,
        finalPrice,
        durationDays: pkg!.durationDays,
        metadata: {
          packageCode: pkg!.code,
          creativeId: dto.creativeId,
          desiredStartAt: dto.desiredStartAt,
          promotionId: dto.promotionId,
        },
      },
    ];

    const intent = buildPackagePurchaseIntent({
      businessId: dto.businessId,
      packageCode: dto.packageCode!,
      promotionId: dto.promotionId,
      creativeId: dto.creativeId,
      desiredStartAt: dto.desiredStartAt,
    });

    return this.persistOrder(user, dto.businessId, lines, {
      intent,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  private async buildProductLines(
    businessId: string,
    business: { cityId: string; categoryId: string },
    items: CreateOrderItemDto[],
  ): Promise<PricedOrderLine[]> {
    const lines: PricedOrderLine[] = [];

    for (const item of items) {
      const product = await this.prisma.monetizationProduct.findUnique({
        where: { code: item.productCode },
      });
      if (!product || !product.isActive) {
        monetizationNotFound(
          MonetizationErrorCode.PRODUCT_NOT_FOUND,
          `Product ${item.productCode} not found`,
        );
      }

      this.assertDuration(item.durationHours, item.durationDays);

      if (product!.type === MonetizationProductType.VIP_BANNER) {
        await this.assertOwnedVipCreative(businessId, item.creativeId);
      }

      const categoryId = item.categoryId ?? business.categoryId;
      await this.purchaseIntegrity.assertCategoryEligibleForBusiness(
        { id: businessId, categoryId: business.categoryId },
        categoryId,
      );

      if (product!.type === MonetizationProductType.PROMOTED_PROMOTION) {
        if (!item.promotionId) {
          monetizationBadRequest(
            MonetizationErrorCode.PROMOTION_NOT_OWNED,
            'promotionId required for PROMOTED_PROMOTION',
          );
        }
        await this.purchaseIntegrity.assertPromotionEligible(
          businessId,
          item.promotionId,
        );
      }

      const priced = await this.pricing.priceProductLine(businessId, {
        productId: product!.id,
        cityId: business.cityId,
        categoryId,
        durationHours: item.durationHours ?? null,
        durationDays: item.durationDays ?? null,
      });

      const desiredStartAt = item.desiredStartAt
        ? new Date(item.desiredStartAt)
        : new Date();
      const desiredEndAt = this.availability.addDuration(
        desiredStartAt,
        item.durationHours,
        item.durationDays,
      );

      await this.purchaseIntegrity.assertProductPurchaseAllowed(this.prisma, {
        productType: product!.type,
        businessId,
        cityId: business.cityId,
        categoryId,
        promotionId: item.promotionId,
        desiredStartAt,
        desiredEndAt,
      });

      lines.push({
        productId: product!.id,
        productCode: product!.code,
        productType: product!.type,
        quantity: 1,
        basePrice: priced.basePrice,
        discountPercent: priced.discountPercent,
        discountAmount: priced.discountAmount,
        finalPrice: priced.finalPrice,
        durationHours: item.durationHours ?? null,
        durationDays: item.durationDays ?? null,
        metadata: {
          desiredStartAt: item.desiredStartAt,
          promotionId: item.promotionId,
          creativeId: item.creativeId,
          categoryId,
        },
      });
    }

    return lines;
  }

  private async persistOrder(
    user: AuthUser,
    businessId: string,
    lines: PricedOrderLine[],
    options?: {
      intent?: PurchaseIntent;
      idempotencyKey?: string;
    },
  ) {
    const subtotal = sumFinalPrices(lines.map((l) => l.basePrice * l.quantity));
    const discountAmount = sumFinalPrices(
      lines.map((l) => l.discountAmount * l.quantity),
    );
    const totalAmount = subtotal - discountAmount;

    return this.prisma.$transaction(async (tx) => {
      if (options?.idempotencyKey) {
        const existingPayment = await this.purchaseIntegrity.findOrderByIdempotencyKey(
          tx,
          options.idempotencyKey,
        );
        if (existingPayment?.order) {
          return this.formatOrderResponse(existingPayment.order, {
            idempotentReplay: true,
            existingOrderId: existingPayment.order.id,
          });
        }
      }

      if (options?.intent) {
        await this.purchaseIntegrity.acquirePurchaseIntentLock(tx, options.intent);
        const pending = await this.purchaseIntegrity.findReusablePendingOrder(
          tx,
          options.intent,
        );
        if (pending) {
          return this.formatOrderResponse(pending, {
            reusedPendingOrder: true,
            existingOrderId: pending.id,
            reasonCode: PurchaseConflictReason.PENDING_ORDER_EXISTS,
          });
        }
      }

      await this.assertPurchaseLinesAllowedInTransaction(tx, businessId, lines);

      const orderNumber = await generateUniqueOrderNumber(async (num) => {
        const existing = await tx.order.findUnique({ where: { orderNumber: num } });
        return !!existing;
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          businessId,
          userId: user.id,
          status: OrderStatus.AWAITING_PAYMENT,
          subtotal,
          discountAmount,
          totalAmount,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              basePrice: line.basePrice,
              discountPercent: line.discountPercent,
              discountAmount: line.discountAmount,
              finalPrice: line.finalPrice,
              durationHours: line.durationHours,
              durationDays: line.durationDays,
              metadata: line.metadata as Prisma.InputJsonValue,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
      });

      let payment;
      try {
        payment = await tx.payment.create({
          data: {
            orderId: order.id,
            provider: PaymentProvider.MANUAL,
            amount: totalAmount,
            currency: 'KZT',
            status: PaymentStatus.PENDING,
            idempotencyKey: options?.idempotencyKey ?? null,
          },
        });
      } catch (err) {
        if (
          options?.idempotencyKey &&
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const replay = await this.purchaseIntegrity.findOrderByIdempotencyKey(
            tx,
            options.idempotencyKey,
          );
          if (replay?.order) {
            return this.formatOrderResponse(replay.order, {
              idempotentReplay: true,
              existingOrderId: replay.order.id,
            });
          }
        }
        throw err;
      }

      const businessScope = await tx.business.findUniqueOrThrow({
        where: { id: businessId },
        select: { cityId: true },
      });

      await this.auditLog.record({
        actor: user,
        action: AuditAction.AD_ORDER_CREATE,
        resourceType: AuditResourceType.ORDER,
        resourceId: order.id,
        businessId,
        cityId: businessScope.cityId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount,
          currency: 'KZT',
        },
        tx,
      });

      return this.formatOrderResponse({ ...order, payments: [payment] });
    });
  }

  private async assertPurchaseLinesAllowedInTransaction(
    tx: Prisma.TransactionClient,
    businessId: string,
    lines: PricedOrderLine[],
  ) {
    const business = await tx.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { cityId: true, categoryId: true },
    });

    for (const line of lines) {
      if (line.productType === MonetizationProductType.PACKAGE) {
        const meta = line.metadata as {
          packageCode?: string;
          desiredStartAt?: string;
          promotionId?: string;
        };
        if (!meta.packageCode) continue;

        const pkg = await tx.promotionPackage.findUnique({
          where: { code: meta.packageCode },
          include: { items: { include: { product: true } } },
        });
        if (!pkg) continue;

        const desiredStartAt = meta.desiredStartAt
          ? new Date(meta.desiredStartAt)
          : new Date();

        for (const pkgItem of pkg.items) {
          const desiredEndAt = this.availability.addDuration(
            desiredStartAt,
            pkgItem.durationHours,
            pkgItem.durationDays,
          );
          await this.purchaseIntegrity.assertProductPurchaseAllowed(tx, {
            productType: pkgItem.product.type,
            businessId,
            cityId: business.cityId,
            categoryId: business.categoryId,
            promotionId:
              pkgItem.product.type === MonetizationProductType.PROMOTED_PROMOTION
                ? meta.promotionId
                : undefined,
            desiredStartAt,
            desiredEndAt,
          });
        }
        continue;
      }

      const meta = line.metadata as {
        desiredStartAt?: string;
        categoryId?: string;
        promotionId?: string;
      };
      const desiredStartAt = meta.desiredStartAt
        ? new Date(meta.desiredStartAt)
        : new Date();
      const desiredEndAt = this.availability.addDuration(
        desiredStartAt,
        line.durationHours,
        line.durationDays,
      );

      await this.purchaseIntegrity.assertProductPurchaseAllowed(tx, {
        productType: line.productType,
        businessId,
        cityId: business.cityId,
        categoryId: meta.categoryId ?? business.categoryId,
        promotionId: meta.promotionId,
        desiredStartAt,
        desiredEndAt,
      });
    }
  }

  private formatOrderResponse(
    order: Parameters<OrderService['formatOrder']>[0],
    extras?: {
      reusedPendingOrder?: boolean;
      idempotentReplay?: boolean;
      existingOrderId?: string;
      reasonCode?: PurchaseConflictReasonType;
    },
  ) {
    return {
      ...this.formatOrder(order),
      reusedPendingOrder: extras?.reusedPendingOrder ?? false,
      idempotentReplay: extras?.idempotentReplay ?? false,
      existingOrderId: extras?.existingOrderId,
      reasonCode: extras?.reasonCode,
    };
  }

  async listOrders(user: AuthUser, businessId: string) {
    await this.access.assertCanManageBusiness(user, businessId);
    const orders = await this.prisma.order.findMany({
      where: { businessId },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.formatOrder(o));
  }

  async getOrder(user: AuthUser, orderId: string) {
    await this.access.assertOrderAccess(user, orderId);
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            adCampaigns: {
              include: {
                product: true,
                creative: {
                  select: {
                    id: true,
                    title: true,
                    moderationStatus: true,
                  },
                },
                campaignPlacements: { include: { placement: true } },
              },
            },
          },
        },
        payments: true,
      },
    });

    return {
      ...this.formatOrder(order),
      campaigns: order.items.flatMap((item) => {
        const meta =
          item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
            ? (item.metadata as { desiredStartAt?: string })
            : {};
        const requestedStartAt = meta.desiredStartAt ?? null;
        return item.adCampaigns.map((c) => ({
          id: c.id,
          status: c.status,
          startAt: c.startAt,
          endAt: c.endAt,
          requestedStartAt,
          product: { code: c.product.code, name: c.product.name },
          creative: c.creative
            ? {
                id: c.creative.id,
                title: c.creative.title,
                moderationStatus: c.creative.moderationStatus,
              }
            : null,
          placements: c.campaignPlacements.map((cp) => cp.placement),
        }));
      }),
    };
  }

  async getAdminOrder(user: AuthUser, orderId: string) {
    await this.access.assertOrderAccess(user, orderId);
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            adCampaigns: {
              include: {
                product: true,
                creative: {
                  select: {
                    id: true,
                    title: true,
                    moderationStatus: true,
                  },
                },
                campaignPlacements: { include: { placement: true } },
              },
            },
          },
        },
        payments: true,
        business: {
          select: {
            id: true,
            title: true,
            city: { select: { slug: true, nameRu: true } },
            category: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    return {
      ...this.formatOrder(order),
      businessId: order.businessId,
      business: order.business,
      campaigns: order.items.flatMap((item) => {
        const meta =
          item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
            ? (item.metadata as { desiredStartAt?: string })
            : {};
        const requestedStartAt = meta.desiredStartAt ?? null;
        return item.adCampaigns.map((c) => ({
          id: c.id,
          status: c.status,
          startAt: c.startAt,
          endAt: c.endAt,
          requestedStartAt,
          product: { code: c.product.code, name: c.product.name },
          creative: c.creative
            ? {
                id: c.creative.id,
                title: c.creative.title,
                moderationStatus: c.creative.moderationStatus,
              }
            : null,
          placements: c.campaignPlacements.map((cp) => cp.placement),
        }));
      }),
    };
  }

  async confirmManualPayment(user: AuthUser, paymentId: string) {
    const payment = await this.access.assertAdminPaymentAccess(user, paymentId);

    if (payment.status === PaymentStatus.PAID) {
      const order = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
      });
      return {
        alreadyPaid: true,
        order: order ? this.formatOrder(order) : null,
      };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_PAYMENT_STATUS,
        'Payment is not pending',
      );
    }

    const order = payment.order;
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_ORDER_STATUS,
        'Order is not awaiting payment',
      );
    }

    if (payment.amount !== order.totalAmount) {
      monetizationBadRequest(
        MonetizationErrorCode.PAYMENT_AMOUNT_MISMATCH,
        'Payment amount does not match order total',
      );
    }

    const paidAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const freshPayment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
      });
      if (freshPayment.status === PaymentStatus.PAID) {
        const existingOrder = await tx.order.findUniqueOrThrow({
          where: { id: payment.orderId },
          include: {
            items: { include: { product: true } },
            payments: true,
          },
        });
        return { alreadyPaid: true, order: this.formatOrder(existingOrder) };
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.PAID, paidAt },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt },
      });

      await this.provisioning.provisionOrderCampaigns(tx, order.id, paidAt);

      const businessScope = await this.prisma.business.findUnique({
        where: { id: order.businessId },
        select: { cityId: true },
      });

      await this.auditLog.record({
        actor: user,
        action: AuditAction.PAYMENT_CONFIRM,
        resourceType: AuditResourceType.PAYMENT,
        resourceId: paymentId,
        businessId: order.businessId,
        cityId: businessScope?.cityId ?? null,
        metadata: {
          paymentId,
          orderId: order.id,
          oldStatus: PaymentStatus.PENDING,
          newStatus: PaymentStatus.PAID,
          amount: payment.amount,
          currency: payment.currency,
        },
        tx,
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
      });

      return { alreadyPaid: false, order: this.formatOrder(updated) };
    });

    return result;
  }

  async listAdminOrders(
    user: AuthUser,
    params: { citySlug?: string; status?: string; page?: number; limit?: number },
  ) {
    const cityId = await this.access.resolveAdminCityFilter(user, params.citySlug);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.OrderWhereInput = {};
    if (cityId) {
      where.business = { cityId };
    }
    if (params.status) {
      where.status = params.status as OrderStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          payments: true,
          business: {
            select: {
              id: true,
              title: true,
              city: { select: { slug: true, nameRu: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((o) => ({
        ...this.formatOrder(o),
        businessId: o.businessId,
        business: o.business,
      })),
      total,
      page,
      limit,
    };
  }

  async listAdminPayments(
    user: AuthUser,
    params: { citySlug?: string; page?: number; limit?: number },
  ) {
    const cityId = await this.access.resolveAdminCityFilter(user, params.citySlug);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.PaymentWhereInput = {};
    if (cityId) {
      where.order = { business: { cityId } };
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              business: {
                select: {
                  id: true,
                  title: true,
                  city: { select: { slug: true, nameRu: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((p) => this.formatAdminPayment(p)),
      total,
      page,
      limit,
    };
  }

  private formatAdminPayment(payment: {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: Date;
    paidAt: Date | null;
    order: {
      orderNumber: string;
      business: {
        id: string;
        title: string;
        city: { slug: string; nameRu: string };
      };
    };
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      business: payment.order.business,
    };
  }

  async getAdminPayment(user: AuthUser, paymentId: string) {
    const payment = await this.access.assertAdminPaymentAccess(user, paymentId);
    const full = await this.prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
      include: {
        order: {
          include: {
            business: {
              select: {
                id: true,
                title: true,
                city: { select: { slug: true, nameRu: true } },
              },
            },
          },
        },
      },
    });
    return this.formatAdminPayment(full);
  }

  private async assertOwnedVipCreative(
    businessId: string,
    creativeId?: string | null,
  ) {
    if (!creativeId) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_REQUIRED,
        'creativeId required for VIP_BANNER',
      );
    }
    const creative = await this.prisma.adCreative.findFirst({
      where: { id: creativeId, businessId },
    });
    if (!creative) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_NOT_OWNED,
        'Creative not found or not owned by business',
      );
    }
  }

  private assertDuration(durationHours?: number, durationDays?: number) {
    if (!durationHours && !durationDays) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_DURATION,
        'durationHours or durationDays required',
      );
    }
    if (durationHours && durationDays) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_DURATION,
        'Specify either durationHours or durationDays, not both',
      );
    }
  }

  private formatOrder(
    order: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      subtotal: number;
      discountAmount: number;
      totalAmount: number;
      currency: string;
      createdAt: Date;
      paidAt: Date | null;
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        basePrice: number;
        discountPercent: number;
        discountAmount: number;
        finalPrice: number;
        durationHours: number | null;
        durationDays: number | null;
        metadata: Prisma.JsonValue | null;
        product: { code: string; name: string; type: MonetizationProductType };
      }>;
      payments?: Array<{
        id: string;
        status: PaymentStatus;
        provider: PaymentProvider;
        amount: number;
        paidAt: Date | null;
      }>;
    },
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      items: order.items.map((item) => ({
        id: item.id,
        productCode: item.product.code,
        productName: item.product.name,
        productType: item.product.type,
        quantity: item.quantity,
        basePrice: item.basePrice,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        finalPrice: item.finalPrice,
        durationHours: item.durationHours,
        durationDays: item.durationDays,
        metadata: item.metadata,
      })),
      payments: order.payments?.map((p) => ({
        id: p.id,
        status: p.status,
        provider: p.provider,
        amount: p.amount,
        paidAt: p.paidAt,
      })),
    };
  }
}
