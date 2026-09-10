import { MonetizationProductType } from '@prisma/client';

export const PACKAGE_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type ScheduleConflictResolution =
  | 'NONE'
  | 'SCHEDULE_AFTER_EXISTING'
  | 'SCHEDULE_AFTER_CAPACITY';

export type PackageSnapshotItemV1 = {
  productId: string;
  productCode: string;
  productType: MonetizationProductType;
  placementCode: string;
  durationHours: number | null;
  durationDays: number | null;
  requestedStartAt: string | null;
  projectedStartAt: string;
  projectedEndAt: string;
  conflictResolvedBy: ScheduleConflictResolution;
  promotionId?: string | null;
  categoryId?: string | null;
  requiresCreative: boolean;
};

export type PackageSnapshotV1 = {
  schemaVersion: typeof PACKAGE_SNAPSHOT_SCHEMA_VERSION;
  packageCode: string;
  packageName: string;
  packageCatalogUpdatedAt: string;
  cityId: string;
  categoryId: string;
  promotionId?: string | null;
  creativeId?: string | null;
  currency: string;
  packageBasePrice: number;
  packageDiscountPercent: number;
  packageDiscountAmount: number;
  packageFinalPrice: number;
  capturedAt: string;
  items: PackageSnapshotItemV1[];
};

export type ProductLineSnapshotV1 = {
  schemaVersion: typeof PACKAGE_SNAPSHOT_SCHEMA_VERSION;
  productCode: string;
  productType: MonetizationProductType;
  placementCode: string;
  requestedStartAt: string | null;
  projectedStartAt: string;
  projectedEndAt: string;
  conflictResolvedBy: ScheduleConflictResolution;
  durationHours: number | null;
  durationDays: number | null;
  promotionId?: string | null;
  categoryId?: string | null;
  creativeId?: string | null;
};

export function parsePackageSnapshotV1(raw: unknown): PackageSnapshotV1 | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as PackageSnapshotV1;
  if (obj.schemaVersion !== PACKAGE_SNAPSHOT_SCHEMA_VERSION) return null;
  if (!Array.isArray(obj.items)) return null;
  return obj;
}

export function parseProductLineSnapshotV1(raw: unknown): ProductLineSnapshotV1 | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as ProductLineSnapshotV1;
  if (obj.schemaVersion !== PACKAGE_SNAPSHOT_SCHEMA_VERSION) return null;
  return obj;
}
