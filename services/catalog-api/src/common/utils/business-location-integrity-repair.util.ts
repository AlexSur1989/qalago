import type { BusinessLocation, Prisma, PrismaClient } from '@prisma/client';
import { BusinessPrimaryLocationService } from '../services/business-primary-location.service';
import {
  collectBusinessLocationBlHygieneReport,
  type BusinessLocationBlHygieneReport,
} from './business-location-bl-hygiene-audit.util';
import {
  collectPrimaryIntegrityReport,
  type PrimaryIntegrityReport,
} from './business-primary-integrity-audit.util';

export type BusinessLocationIntegrityMode = 'DRY_RUN' | 'APPLY' | 'AUDIT_ONLY';

export type IntegrityProblemType =
  | 'VALID'
  | 'ZERO_LOCATION'
  | 'ZERO_PRIMARY'
  | 'MULTI_PRIMARY';

export type RepairAction = 'NONE' | 'PROMOTE_DETERMINISTIC_PRIMARY' | 'MANUAL_REMEDIATION';

export type RepairItemResult =
  | 'PLANNED'
  | 'REPAIRED'
  | 'SKIPPED_ALREADY_VALID'
  | 'SKIPPED_NOT_FOUND'
  | 'SKIPPED_STALE_STATE'
  | 'MANUAL_REMEDIATION'
  | 'FAILED';

export type BusinessLocationIntegrityItem = {
  businessId: string;
  title?: string;
  problemType: IntegrityProblemType;
  proposedAction: RepairAction;
  locationIds?: string[];
  chosenLocationId?: string;
  result: RepairItemResult;
  reason?: string;
  errorCode?: string;
};

export type BusinessLocationIntegritySummary = {
  mode: BusinessLocationIntegrityMode;
  businessCount: number;
  locationCount: number;
  validCount: number;
  zeroLocationCount: number;
  zeroPrimaryCount: number;
  multiPrimaryCount: number;
  repairableCount: number;
  manualRemediationCount: number;
  repairedCount: number;
  skippedCount: number;
  failedCount: number;
  items: BusinessLocationIntegrityItem[];
  /** Backward-compatible aggregate from A.9.1 collector. */
  primaryIntegrity: PrimaryIntegrityReport;
  blHygiene: BusinessLocationBlHygieneReport;
  pass: boolean;
};

type DbClient = Pick<
  PrismaClient,
  '$queryRaw' | '$transaction' | 'business' | 'businessLocation'
>;

const primaryLocationService = new BusinessPrimaryLocationService();

export function pickDeterministicPrimaryLocationId(
  locations: readonly Pick<BusinessLocation, 'id' | 'createdAt'>[],
): string | null {
  if (locations.length === 0) return null;
  const sorted = [...locations].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  return sorted[0]!.id;
}

async function loadIntegrityBusinessIds(prisma: DbClient): Promise<{
  zeroLocationBusinessIds: string[];
  zeroPrimaryBusinessIds: string[];
  multiPrimaryBusinessIds: string[];
}> {
  const zeroLocationRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT b.id FROM "Business" b
    WHERE NOT EXISTS (SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b.id)`;

  const zeroPrimaryRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT b.id FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b.id
    GROUP BY b.id
    HAVING COUNT(bl.id) >= 1
      AND SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) = 0`;

  const multiPrimaryRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT b.id FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b.id
    GROUP BY b.id
    HAVING SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) > 1`;

  return {
    zeroLocationBusinessIds: zeroLocationRows.map((r) => r.id),
    zeroPrimaryBusinessIds: zeroPrimaryRows.map((r) => r.id),
    multiPrimaryBusinessIds: multiPrimaryRows.map((r) => r.id),
  };
}

function planItemForZeroLocation(
  business: Pick<{ title: string }, 'title'>,
): Pick<
  BusinessLocationIntegrityItem,
  'problemType' | 'proposedAction' | 'result' | 'reason' | 'errorCode'
> {
  return {
    problemType: 'ZERO_LOCATION',
    proposedAction: 'MANUAL_REMEDIATION',
    result: 'MANUAL_REMEDIATION',
    reason:
      'Business has no BusinessLocation rows — manual remediation required (legacy Business geo is not authoritative)',
    errorCode: 'MANUAL_REMEDIATION',
  };
}

async function applyZeroPrimaryRepair(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<BusinessLocationIntegrityItem> {
  const business = await tx.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return {
      businessId,
      problemType: 'ZERO_PRIMARY',
      proposedAction: 'PROMOTE_DETERMINISTIC_PRIMARY',
      result: 'SKIPPED_NOT_FOUND',
      reason: 'Business no longer exists',
      errorCode: 'NOT_FOUND',
    };
  }

  const locations = await tx.businessLocation.findMany({
    where: { businessId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  const primaryCount = locations.filter((row) => row.isPrimary).length;

  if (locations.length === 0) {
    return {
      businessId,
      title: business.title,
      problemType: 'ZERO_LOCATION',
      proposedAction: 'MANUAL_REMEDIATION',
      result: 'SKIPPED_STALE_STATE',
      reason: 'State changed to zero-location since planning',
      errorCode: 'STALE_STATE',
    };
  }
  if (primaryCount === 1) {
    return {
      businessId,
      title: business.title,
      problemType: 'VALID',
      proposedAction: 'NONE',
      result: 'SKIPPED_ALREADY_VALID',
      reason: 'Business already has exactly one primary',
    };
  }
  if (primaryCount > 1) {
    return {
      businessId,
      title: business.title,
      problemType: 'MULTI_PRIMARY',
      proposedAction: 'MANUAL_REMEDIATION',
      result: 'MANUAL_REMEDIATION',
      reason: 'Multiple primary rows require manual remediation',
      errorCode: 'MULTI_PRIMARY',
    };
  }

  const chosenId = pickDeterministicPrimaryLocationId(locations);
  if (!chosenId) {
    return {
      businessId,
      title: business.title,
      problemType: 'ZERO_PRIMARY',
      proposedAction: 'PROMOTE_DETERMINISTIC_PRIMARY',
      result: 'FAILED',
      reason: 'No candidate location',
      errorCode: 'NO_CANDIDATE',
    };
  }

  try {
    await tx.businessLocation.updateMany({
      where: { businessId, id: { not: chosenId } },
      data: { isPrimary: false },
    });
    const newPrimary = await tx.businessLocation.update({
      where: { id: chosenId },
      data: { isPrimary: true },
    });
    await primaryLocationService.syncBusinessFromPrimaryLocationRecord(tx, newPrimary);

    return {
      businessId,
      title: business.title,
      problemType: 'ZERO_PRIMARY',
      proposedAction: 'PROMOTE_DETERMINISTIC_PRIMARY',
      locationIds: locations.map((l) => l.id),
      chosenLocationId: chosenId,
      result: 'REPAIRED',
      reason: 'Promoted deterministic primary and synced Business city/contact compatibility',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repair transaction failed';
    return {
      businessId,
      title: business.title,
      problemType: 'ZERO_PRIMARY',
      proposedAction: 'PROMOTE_DETERMINISTIC_PRIMARY',
      result: 'FAILED',
      reason: message,
      errorCode: 'REPAIR_FAILED',
    };
  }
}

export async function runBusinessLocationIntegrity(
  prisma: DbClient,
  mode: BusinessLocationIntegrityMode,
): Promise<BusinessLocationIntegritySummary> {
  const primaryIntegrity = await collectPrimaryIntegrityReport(prisma);
  const blHygiene = await collectBusinessLocationBlHygieneReport(prisma);
  const ids = await loadIntegrityBusinessIds(prisma);

  const problemBusinessIds = new Set([
    ...ids.zeroLocationBusinessIds,
    ...ids.zeroPrimaryBusinessIds,
    ...ids.multiPrimaryBusinessIds,
  ]);

  const items: BusinessLocationIntegrityItem[] = [];

  for (const businessId of ids.multiPrimaryBusinessIds) {
    items.push({
      businessId,
      problemType: 'MULTI_PRIMARY',
      proposedAction: 'MANUAL_REMEDIATION',
      result: mode === 'APPLY' ? 'MANUAL_REMEDIATION' : 'PLANNED',
      reason: 'More than one primary BusinessLocation — automatic repair not enabled in 2A',
      errorCode: 'MULTI_PRIMARY',
    });
  }

  for (const businessId of ids.zeroLocationBusinessIds) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      items.push({
        businessId,
        problemType: 'ZERO_LOCATION',
        proposedAction: 'MANUAL_REMEDIATION',
        result: 'SKIPPED_NOT_FOUND',
        reason: 'Business not found',
        errorCode: 'NOT_FOUND',
      });
      continue;
    }
    items.push({
      businessId,
      title: business.title,
      ...planItemForZeroLocation(business),
    });
  }

  for (const businessId of ids.zeroPrimaryBusinessIds) {
    if (problemBusinessIds.has(businessId) && ids.zeroLocationBusinessIds.includes(businessId)) {
      continue;
    }
    const locations = await prisma.businessLocation.findMany({
      where: { businessId },
      select: { id: true, createdAt: true, isPrimary: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const chosenLocationId = pickDeterministicPrimaryLocationId(locations) ?? undefined;
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { title: true },
    });

    if (mode === 'APPLY') {
      const applied = await prisma.$transaction((tx) =>
        applyZeroPrimaryRepair(tx, businessId),
      );
      items.push(applied);
    } else {
      items.push({
        businessId,
        title: business?.title,
        problemType: 'ZERO_PRIMARY',
        proposedAction: 'PROMOTE_DETERMINISTIC_PRIMARY',
        locationIds: locations.map((l) => l.id),
        chosenLocationId,
        result: 'PLANNED',
        reason:
          'Promote oldest location (createdAt ASC, id ASC) and sync Business city/contact compatibility',
      });
    }
  }

  const repairableCount = items.filter(
    (i) =>
      i.proposedAction === 'PROMOTE_DETERMINISTIC_PRIMARY' &&
      (i.result === 'PLANNED' || i.result === 'REPAIRED'),
  ).length;

  const manualRemediationCount = items.filter(
    (i) => i.result === 'MANUAL_REMEDIATION' || i.proposedAction === 'MANUAL_REMEDIATION',
  ).length;

  const repairedCount = items.filter((i) => i.result === 'REPAIRED').length;
  const skippedCount = items.filter((i) => i.result.startsWith('SKIPPED_')).length;
  const failedCount = items.filter((i) => i.result === 'FAILED').length;

  let finalIds = ids;
  let finalPrimaryIntegrity = primaryIntegrity;
  let finalBlHygiene = blHygiene;
  if (mode === 'APPLY') {
    finalPrimaryIntegrity = await collectPrimaryIntegrityReport(prisma);
    finalBlHygiene = await collectBusinessLocationBlHygieneReport(prisma);
    finalIds = await loadIntegrityBusinessIds(prisma);
  }

  const structuralPass =
    finalIds.zeroLocationBusinessIds.length === 0 &&
    finalIds.zeroPrimaryBusinessIds.length === 0 &&
    finalIds.multiPrimaryBusinessIds.length === 0 &&
    failedCount === 0 &&
    manualRemediationCount === 0;

  const pass = structuralPass && finalBlHygiene.pass;

  return {
    mode,
    businessCount: finalPrimaryIntegrity.businessesTotal,
    locationCount: finalPrimaryIntegrity.locationsTotal,
    validCount: Math.max(
      0,
      finalPrimaryIntegrity.businessesTotal -
        finalIds.zeroLocationBusinessIds.length -
        finalIds.zeroPrimaryBusinessIds.length -
        finalIds.multiPrimaryBusinessIds.length,
    ),
    zeroLocationCount: finalIds.zeroLocationBusinessIds.length,
    zeroPrimaryCount: finalIds.zeroPrimaryBusinessIds.length,
    multiPrimaryCount: finalIds.multiPrimaryBusinessIds.length,
    repairableCount,
    manualRemediationCount,
    repairedCount,
    skippedCount,
    failedCount,
    items,
    primaryIntegrity: finalPrimaryIntegrity,
    blHygiene: finalBlHygiene,
    pass,
  };
}

export function formatBusinessLocationIntegritySummary(
  summary: BusinessLocationIntegritySummary,
  options?: { concise?: boolean },
): string {
  if (options?.concise) {
    return JSON.stringify(
      {
        mode: summary.mode,
        pass: summary.pass,
        businessCount: summary.businessCount,
        locationCount: summary.locationCount,
        zeroLocationCount: summary.zeroLocationCount,
        zeroPrimaryCount: summary.zeroPrimaryCount,
        multiPrimaryCount: summary.multiPrimaryCount,
        blHygiene: summary.blHygiene,
        manualRemediationCount: summary.manualRemediationCount,
        failedCount: summary.failedCount,
      },
      null,
      2,
    );
  }
  return JSON.stringify(
    {
      stage: '6.12A.9.4.4C2',
      ...summary,
    },
    null,
    2,
  );
}

/** Exit code: 0 when integrity pass; 1 when violations/manual/failures remain or runtime error. */
export function businessLocationIntegrityExitCode(summary: BusinessLocationIntegritySummary): number {
  return summary.pass ? 0 : 1;
}
