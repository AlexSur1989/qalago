import { Injectable } from '@nestjs/common';
import {
  AdInventoryReservationStatus,
  MonetizationProductType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
import { resolveInventoryReservationTtlMs } from './constants/monetization.constants';
import {
  PackageSnapshotItemV1,
  PackageSnapshotV1,
  ProductLineSnapshotV1,
  parsePackageSnapshotV1,
  parseProductLineSnapshotV1,
} from './types/package-snapshot.types';

@Injectable()
export class InventoryReservationService {
  constructor(private readonly prisma: PrismaService) {}

  reservationExpiresAt(from = new Date()): Date {
    return new Date(from.getTime() + resolveInventoryReservationTtlMs());
  }

  async expireStaleHeldInTransaction(tx: Prisma.TransactionClient, now = new Date()) {
    await tx.adInventoryReservation.updateMany({
      where: {
        status: AdInventoryReservationStatus.HELD,
        expiresAt: { lte: now },
      },
      data: { status: AdInventoryReservationStatus.EXPIRED },
    });
  }

  async cancelHeldForOrder(tx: Prisma.TransactionClient, orderId: string) {
    await tx.adInventoryReservation.updateMany({
      where: {
        orderId,
        status: AdInventoryReservationStatus.HELD,
      },
      data: { status: AdInventoryReservationStatus.CANCELLED },
    });
  }

  async convertHeldForOrder(tx: Prisma.TransactionClient, orderId: string) {
    await tx.adInventoryReservation.updateMany({
      where: {
        orderId,
        status: AdInventoryReservationStatus.HELD,
      },
      data: { status: AdInventoryReservationStatus.CONVERTED },
    });
  }

  private async createReservation(
    tx: Prisma.TransactionClient,
    row: {
      orderId: string;
      orderItemId: string;
      businessId: string;
      cityId: string;
      placementId: string;
      categoryId?: string | null;
      promotionId?: string | null;
      productId: string;
      startAt: Date;
      endAt: Date;
      expiresAt: Date;
    },
  ) {
    return tx.adInventoryReservation.create({
      data: {
        ...row,
        status: AdInventoryReservationStatus.HELD,
      },
    });
  }

  async syncReservationsForOrderItem(
    tx: Prisma.TransactionClient,
    input: {
      orderId: string;
      orderItemId: string;
      businessId: string;
      cityId: string;
      productId: string;
      productType: MonetizationProductType;
      packageSnapshot?: unknown;
      lineSnapshot?: unknown;
      expiresAt: Date;
    },
  ) {
    await tx.adInventoryReservation.deleteMany({
      where: {
        orderItemId: input.orderItemId,
        status: AdInventoryReservationStatus.HELD,
      },
    });

    const pkg = parsePackageSnapshotV1(input.packageSnapshot);
    if (pkg) {
      for (const item of pkg.items) {
        const placement = await tx.adPlacement.findUnique({
          where: { code: item.placementCode },
        });
        if (!placement) continue;
        await this.createReservation(tx, {
          orderId: input.orderId,
          orderItemId: input.orderItemId,
          businessId: input.businessId,
          cityId: input.cityId,
          placementId: placement.id,
          categoryId: item.categoryId ?? pkg.categoryId,
          promotionId: item.promotionId ?? pkg.promotionId ?? null,
          productId: item.productId,
          startAt: new Date(item.projectedStartAt),
          endAt: new Date(item.projectedEndAt),
          expiresAt: input.expiresAt,
        });
      }
      return;
    }

    const line = parseProductLineSnapshotV1(input.lineSnapshot);
    if (!line) return;

    const placementCode = PRODUCT_PLACEMENT_MAP[input.productType];
    if (!placementCode) return;
    const placement = await tx.adPlacement.findUnique({
      where: { code: placementCode },
    });
    if (!placement) return;

    await this.createReservation(tx, {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      businessId: input.businessId,
      cityId: input.cityId,
      placementId: placement.id,
      categoryId: line.categoryId ?? null,
      promotionId: line.promotionId ?? null,
      productId: input.productId,
      startAt: new Date(line.projectedStartAt),
      endAt: new Date(line.projectedEndAt),
      expiresAt: input.expiresAt,
    });
  }

  extractPackageItems(snapshot: PackageSnapshotV1): PackageSnapshotItemV1[] {
    return snapshot.items;
  }
}
