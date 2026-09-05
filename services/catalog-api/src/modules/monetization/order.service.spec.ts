import {
  MonetizationProductType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { OrderService } from './order.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrderService', () => {
  const prisma = {
    $transaction: jest.fn(),
    business: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    monetizationProduct: { findUnique: jest.fn() },
    promotionPackage: { findUnique: jest.fn() },
    order: { findMany: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    payment: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn() },
  } as unknown as PrismaService;

  const access = {
    assertCanManageBusiness: jest.fn(),
    assertOrderAccess: jest.fn(),
    assertAdminPaymentAccess: jest.fn(),
    resolveAdminCityFilter: jest.fn(),
  } as unknown as MonetizationAccessService;

  const pricing = {
    priceProductLine: jest.fn(),
    packageDiscountPercent: jest.fn().mockReturnValue(0),
    applyDiscount: jest.fn(),
  } as unknown as PricingService;

  const availability = {
    addDuration: jest.fn((start: Date, _h?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setDate(end.getDate() + days);
      return end;
    }),
    checkAvailability: jest.fn().mockResolvedValue({ available: true }),
    assertAvailableInTransaction: jest.fn().mockResolvedValue(undefined),
  } as unknown as AvailabilityService;

  const provisioning = {
    provisionOrderCampaigns: jest.fn().mockResolvedValue(undefined),
  } as unknown as CampaignProvisioningService;

  const service = new OrderService(prisma, access, pricing, availability, provisioning);

  const user = { id: 'user-1', role: UserRole.BUSINESS, phone: '+7700', sub: 'user-1' };
  const business = { cityId: 'city-1', categoryId: 'cat-1', ownerId: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    availability.checkAvailability = jest.fn().mockResolvedValue({ available: true });
    availability.assertAvailableInTransaction = jest.fn().mockResolvedValue(undefined);
  });

  it('11. create order snapshot price', async () => {
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'TOP_CATEGORY',
      type: MonetizationProductType.TOP_CATEGORY,
      isActive: true,
    });
    pricing.priceProductLine = jest.fn().mockResolvedValue({
      basePrice: 4900,
      discountPercent: 10,
      discountAmount: 490,
      finalPrice: 4410,
      currency: 'KZT',
      productPriceId: 'price-1',
    });

    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const tx = {
        business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'ord-1',
            orderNumber: 'QLG-20260905-ABC123',
            status: OrderStatus.AWAITING_PAYMENT,
            subtotal: 4900,
            discountAmount: 490,
            totalAmount: 4410,
            currency: 'KZT',
            createdAt: new Date(),
            paidAt: null,
            items: [
              {
                id: 'item-1',
                productId: 'prod-1',
                quantity: 1,
                basePrice: 4900,
                discountPercent: 10,
                discountAmount: 490,
                finalPrice: 4410,
                durationDays: 7,
                durationHours: null,
                metadata: {},
                product: {
                  code: 'TOP_CATEGORY',
                  name: 'Top',
                  type: MonetizationProductType.TOP_CATEGORY,
                },
              },
            ],
            payments: [],
          }),
        },
        payment: {
          create: jest.fn().mockResolvedValue({
            id: 'pay-1',
            status: PaymentStatus.PENDING,
            provider: PaymentProvider.MANUAL,
            amount: 4410,
            paidAt: null,
          }),
        },
      };
      return fn(tx);
    });

    const result = await service.createOrder(user, {
      businessId: 'biz-1',
      items: [{ productCode: 'TOP_CATEGORY', durationDays: 7, finalPrice: 1 }],
    });

    expect(result.subtotal).toBe(4900);
    expect(result.discountAmount).toBe(490);
    expect(result.totalAmount).toBe(4410);
    expect(result.items[0].basePrice).toBe(4900);
  });

  it('12. frontend fake finalPrice ignored', async () => {
    pricing.priceProductLine = jest.fn().mockResolvedValue({
      basePrice: 4900,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: 4900,
      currency: 'KZT',
      productPriceId: 'price-1',
    });
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'TOP_CATEGORY',
      type: MonetizationProductType.TOP_CATEGORY,
      isActive: true,
    });

    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const tx = {
        business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) => {
            expect(data.items.create[0].finalPrice).toBe(4900);
            return Promise.resolve({
              id: 'ord-1',
              orderNumber: 'QLG-20260905-ABC123',
              status: OrderStatus.AWAITING_PAYMENT,
              subtotal: 4900,
              discountAmount: 0,
              totalAmount: 4900,
              currency: 'KZT',
              createdAt: new Date(),
              paidAt: null,
              items: [],
              payments: [],
            });
          }),
        },
        payment: {
          create: jest.fn().mockResolvedValue({
            id: 'pay-1',
            status: PaymentStatus.PENDING,
            provider: PaymentProvider.MANUAL,
            amount: 4900,
            paidAt: null,
          }),
        },
      };
      return fn(tx);
    });

    await service.createOrder(user, {
      businessId: 'biz-1',
      items: [{ productCode: 'TOP_CATEGORY', durationDays: 7, finalPrice: 100 }],
    });

    expect(pricing.priceProductLine).toHaveBeenCalled();
  });

  it('13. unauthorized owner rejected', async () => {
    access.assertCanManageBusiness = jest.fn().mockImplementation(() => {
      throw { response: { code: 'BUSINESS_NOT_OWNED' } };
    });

    await expect(
      service.createOrder(user, {
        businessId: 'biz-other',
        items: [{ productCode: 'TOP_CATEGORY', durationDays: 7 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'BUSINESS_NOT_OWNED' } });
  });

  it('14. invalid duration rejected', async () => {
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'TOP_CATEGORY',
      type: MonetizationProductType.TOP_CATEGORY,
      isActive: true,
    });

    await expect(
      service.createOrder(user, {
        businessId: 'biz-1',
        items: [{ productCode: 'TOP_CATEGORY' }],
      }),
    ).rejects.toMatchObject({ response: { code: 'INVALID_DURATION' } });
  });

  it('15. unavailable placement rejected', async () => {
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'VIP_BANNER',
      type: MonetizationProductType.VIP_BANNER,
      isActive: true,
    });
    pricing.priceProductLine = jest.fn().mockResolvedValue({
      basePrice: 12900,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: 12900,
      currency: 'KZT',
      productPriceId: 'price-1',
    });
    availability.checkAvailability = jest.fn().mockResolvedValue({ available: false });

    await expect(
      service.createOrder(user, {
        businessId: 'biz-1',
        items: [{ productCode: 'VIP_BANNER', durationDays: 7 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'PLACEMENT_UNAVAILABLE' } });
  });

  it('16. order totals correct (subtotal - discount = total)', async () => {
    pricing.priceProductLine = jest.fn().mockResolvedValue({
      basePrice: 1000,
      discountPercent: 15,
      discountAmount: 150,
      finalPrice: 850,
      currency: 'KZT',
      productPriceId: 'price-1',
    });
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'TOP_CATEGORY',
      type: MonetizationProductType.TOP_CATEGORY,
      isActive: true,
    });

    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const tx = {
        business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) => {
            expect(data.subtotal - data.discountAmount).toBe(data.totalAmount);
            return Promise.resolve({
              id: 'ord-1',
              orderNumber: 'QLG-20260905-ABC123',
              status: OrderStatus.AWAITING_PAYMENT,
              subtotal: data.subtotal,
              discountAmount: data.discountAmount,
              totalAmount: data.totalAmount,
              currency: 'KZT',
              createdAt: new Date(),
              paidAt: null,
              items: [],
              payments: [],
            });
          }),
        },
        payment: {
          create: jest.fn().mockResolvedValue({
            id: 'pay-1',
            status: PaymentStatus.PENDING,
            provider: PaymentProvider.MANUAL,
            amount: 850,
            paidAt: null,
          }),
        },
      };
      return fn(tx);
    });

    const result = await service.createOrder(user, {
      businessId: 'biz-1',
      items: [{ productCode: 'TOP_CATEGORY', durationDays: 7 }],
    });

    expect(result.totalAmount).toBe(result.subtotal - result.discountAmount);
  });

  it('17. manual Payment PENDING on order create', async () => {
    access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
    prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
      id: 'prod-1',
      code: 'TOP_CATEGORY',
      type: MonetizationProductType.TOP_CATEGORY,
      isActive: true,
    });
    pricing.priceProductLine = jest.fn().mockResolvedValue({
      basePrice: 4900,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: 4900,
      currency: 'KZT',
      productPriceId: 'price-1',
    });

    let paymentCreate: jest.Mock | undefined;
    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      paymentCreate = jest.fn().mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.MANUAL,
        amount: 4900,
        paidAt: null,
      });
      const tx = {
        business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'ord-1',
            orderNumber: 'QLG-20260905-ABC123',
            status: OrderStatus.AWAITING_PAYMENT,
            subtotal: 4900,
            discountAmount: 0,
            totalAmount: 4900,
            currency: 'KZT',
            createdAt: new Date(),
            paidAt: null,
            items: [],
            payments: [],
          }),
        },
        payment: { create: paymentCreate },
      };
      return fn(tx);
    });

    const result = await service.createOrder(user, {
      businessId: 'biz-1',
      items: [{ productCode: 'TOP_CATEGORY', durationDays: 7 }],
    });

    expect(paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: PaymentProvider.MANUAL,
          status: PaymentStatus.PENDING,
        }),
      }),
    );
    expect(result.payments?.[0]?.status).toBe(PaymentStatus.PENDING);
  });

  it('18-19. confirm → Payment PAID and Order PAID', async () => {
    const paidAt = new Date();
    access.assertAdminPaymentAccess = jest.fn().mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      amount: 4900,
      orderId: 'ord-1',
      order: { id: 'ord-1', status: OrderStatus.AWAITING_PAYMENT, totalAmount: 4900 },
    });

    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const tx = {
        payment: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ status: PaymentStatus.PENDING }),
          update: jest.fn(),
        },
        order: {
          update: jest.fn(),
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            id: 'ord-1',
            orderNumber: 'QLG-20260905-ABC123',
            status: OrderStatus.PAID,
            subtotal: 4900,
            discountAmount: 0,
            totalAmount: 4900,
            currency: 'KZT',
            createdAt: new Date(),
            paidAt,
            items: [],
            payments: [{ id: 'pay-1', status: PaymentStatus.PAID, provider: PaymentProvider.MANUAL, amount: 4900, paidAt }],
          }),
        },
      };
      return fn(tx);
    });

    const result = await service.confirmManualPayment(
      { id: 'admin-1', role: UserRole.ADMIN, phone: '+7700', sub: 'admin-1' },
      'pay-1',
    );

    expect(result.alreadyPaid).toBe(false);
    expect(result.order?.status).toBe(OrderStatus.PAID);
    expect(provisioning.provisionOrderCampaigns).toHaveBeenCalled();
  });

  it('20. amount mismatch rejected', async () => {
    access.assertAdminPaymentAccess = jest.fn().mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      amount: 1000,
      orderId: 'ord-1',
      order: { id: 'ord-1', status: OrderStatus.AWAITING_PAYMENT, totalAmount: 4900 },
    });

    await expect(
      service.confirmManualPayment(
        { id: 'admin-1', role: UserRole.ADMIN, phone: '+7700', sub: 'admin-1' },
        'pay-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'PAYMENT_AMOUNT_MISMATCH' } });
  });

  it('21. double confirmation idempotent', async () => {
    access.assertAdminPaymentAccess = jest.fn().mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PAID,
      amount: 4900,
      orderId: 'ord-1',
      order: { id: 'ord-1', status: OrderStatus.PAID, totalAmount: 4900 },
    });
    prisma.order.findUnique = jest.fn().mockResolvedValue({
      id: 'ord-1',
      orderNumber: 'QLG-20260905-ABC123',
      status: OrderStatus.PAID,
      subtotal: 4900,
      discountAmount: 0,
      totalAmount: 4900,
      currency: 'KZT',
      createdAt: new Date(),
      paidAt: new Date(),
      items: [],
      payments: [],
    });

    const result = await service.confirmManualPayment(
      { id: 'admin-1', role: UserRole.ADMIN, phone: '+7700', sub: 'admin-1' },
      'pay-1',
    );

    expect(result.alreadyPaid).toBe(true);
    expect(provisioning.provisionOrderCampaigns).not.toHaveBeenCalled();
  });

  it('22. campaign created once (provisioning called once in transaction)', async () => {
    access.assertAdminPaymentAccess = jest.fn().mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      amount: 4900,
      orderId: 'ord-1',
      order: { id: 'ord-1', status: OrderStatus.AWAITING_PAYMENT, totalAmount: 4900 },
    });

    prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
      const tx = {
        payment: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ status: PaymentStatus.PENDING }),
          update: jest.fn(),
        },
        order: {
          update: jest.fn(),
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            id: 'ord-1',
            orderNumber: 'QLG-20260905-ABC123',
            status: OrderStatus.PAID,
            subtotal: 4900,
            discountAmount: 0,
            totalAmount: 4900,
            currency: 'KZT',
            createdAt: new Date(),
            paidAt: new Date(),
            items: [],
            payments: [],
          }),
        },
      };
      return fn(tx);
    });

    await service.confirmManualPayment(
      { id: 'admin-1', role: UserRole.ADMIN, phone: '+7700', sub: 'admin-1' },
      'pay-1',
    );

    expect(provisioning.provisionOrderCampaigns).toHaveBeenCalledTimes(1);
  });
});
