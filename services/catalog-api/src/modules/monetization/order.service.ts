import { Injectable } from '@nestjs/common';
import {
  MonetizationProductType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { PACKAGE_PRODUCT_CODE } from './constants/monetization.constants';
import { CreateOrderDto, CreateOrderItemDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
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
    return this.persistOrder(user, dto.businessId, lines);
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

    for (const item of pkg!.items) {
      const desiredStartAt = new Date();
      const desiredEndAt = this.availability.addDuration(
        desiredStartAt,
        item.durationHours,
        item.durationDays,
      );
      const availability = await this.availability.checkAvailability({
        productType: item.product.type,
        cityId: business.cityId,
        categoryId: business.categoryId,
        desiredStartAt,
        desiredEndAt,
      });
      if (!availability.available) {
        monetizationBadRequest(
          MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
          `Package item ${item.product.code} unavailable`,
        );
      }
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
        metadata: { packageCode: pkg!.code },
      },
    ];

    return this.persistOrder(user, dto.businessId, lines);
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

      const categoryId = item.categoryId ?? business.categoryId;
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

      const availability = await this.availability.checkAvailability({
        productType: product!.type,
        cityId: business.cityId,
        categoryId,
        desiredStartAt,
        desiredEndAt,
      });
      if (!availability.available) {
        monetizationBadRequest(
          MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
          `Placement unavailable for ${item.productCode}`,
        );
      }

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
  ) {
    const subtotal = sumFinalPrices(lines.map((l) => l.basePrice * l.quantity));
    const discountAmount = sumFinalPrices(
      lines.map((l) => l.discountAmount * l.quantity),
    );
    const totalAmount = subtotal - discountAmount;

    return this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        if (line.productType === MonetizationProductType.PACKAGE) continue;
        const meta = line.metadata as {
          desiredStartAt?: string;
          categoryId?: string;
        };
        const desiredStartAt = meta.desiredStartAt
          ? new Date(meta.desiredStartAt)
          : new Date();
        const desiredEndAt = this.availability.addDuration(
          desiredStartAt,
          line.durationHours,
          line.durationDays,
        );
        await this.availability.assertAvailableInTransaction(tx, {
          productType: line.productType,
          cityId: (await tx.business.findUniqueOrThrow({
            where: { id: businessId },
            select: { cityId: true },
          })).cityId,
          categoryId: meta.categoryId,
          desiredStartAt,
          desiredEndAt,
        });
      }

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

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.MANUAL,
          amount: totalAmount,
          currency: 'KZT',
          status: PaymentStatus.PENDING,
        },
      });

      return this.formatOrder({ ...order, payments: [payment] });
    });
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
    const order = await this.access.assertOrderAccess(user, orderId);
    return this.formatOrder(order);
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
          business: { select: { id: true, title: true, cityId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((o) => this.formatOrder(o)),
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
              business: { select: { id: true, title: true, cityId: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getAdminPayment(user: AuthUser, paymentId: string) {
    const payment = await this.access.assertAdminPaymentAccess(user, paymentId);
    return payment;
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
