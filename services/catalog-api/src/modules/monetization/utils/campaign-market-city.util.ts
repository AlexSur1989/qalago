import { Prisma, PrismaClient } from '@prisma/client';
import { findPrimaryBusinessLocationCityId } from '../../../common/utils/primary-business-location.util';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from '../errors/monetization.errors';
import { loadScopedBusinessLocation } from './campaign-location-context.util';

type CampaignCityDb = Pick<PrismaClient, 'businessLocation'>;

export type CampaignMarketCityInput = {
  businessId: string;
  /** Quote / availability explicit market city (validated against branch presence). */
  explicitCityId?: string | null;
  targetBusinessLocationId?: string | null;
  destinationBusinessLocationId?: string | null;
};

function normalizeId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function failMarketCityUnresolved(): never {
  monetizationBadRequest(
    MonetizationErrorCode.CAMPAIGN_MARKET_CITY_UNRESOLVED,
    'Cannot resolve campaign market city from branch or primary location context',
  );
}

/**
 * Stage 6.12A.9.4.1B / 6.12A.9.4.5B — campaign/order market city resolution.
 * Priority: target/destination BL city → explicit city with BL presence → primary BL.
 * Does not use Business.cityId (A.9.4.5B).
 */
export async function resolveCampaignMarketCityId(
  db: Prisma.TransactionClient | CampaignCityDb,
  input: CampaignMarketCityInput,
): Promise<string> {
  const targetId = normalizeId(input.targetBusinessLocationId);
  const destinationId = normalizeId(input.destinationBusinessLocationId);
  const branchId = targetId ?? destinationId;

  if (branchId) {
    const loc = await loadScopedBusinessLocation(
      db as Prisma.TransactionClient,
      input.businessId,
      branchId,
    );
    const explicit = normalizeId(input.explicitCityId);
    if (explicit && explicit !== loc.cityId) {
      monetizationBadRequest(
        MonetizationErrorCode.CAMPAIGN_BRANCH_CITY_MISMATCH,
        'Selected city does not match target branch city',
      );
    }
    return loc.cityId;
  }

  const explicit = normalizeId(input.explicitCityId);
  if (explicit) {
    if (!db.businessLocation?.findFirst) {
      failMarketCityUnresolved();
    }
    const inCity = await db.businessLocation.findFirst({
      where: { businessId: input.businessId, cityId: explicit },
      select: { id: true },
    });
    if (!inCity) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_CAMPAIGN_BRANCH,
        'Business has no branch in the selected campaign city',
      );
    }
    return explicit;
  }

  const primaryCity = await findPrimaryBusinessLocationCityId(db, input.businessId);
  if (primaryCity) {
    return primaryCity;
  }

  failMarketCityUnresolved();
}

export function readCampaignCityIdFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!metadata) return undefined;
  const value = metadata.campaignCityId;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readBranchIdsFromMetadata(metadata: Record<string, unknown> | null | undefined): {
  targetBusinessLocationId?: string | null;
  destinationBusinessLocationId?: string | null;
} {
  if (!metadata) return {};
  const target = metadata.targetBusinessLocationId;
  const destination = metadata.destinationBusinessLocationId;
  return {
    targetBusinessLocationId: typeof target === 'string' ? target : null,
    destinationBusinessLocationId: typeof destination === 'string' ? destination : null,
  };
}

/**
 * Purchase-time stable city: persisted order metadata first, then live resolver (no Business.cityId).
 */
export async function resolvePersistedOrderItemMarketCityId(
  db: Prisma.TransactionClient | CampaignCityDb,
  businessId: string,
  metadata: Record<string, unknown> | null | undefined,
): Promise<string> {
  const persisted = readCampaignCityIdFromMetadata(metadata);
  if (persisted) return persisted;
  const branches = readBranchIdsFromMetadata(metadata);
  return resolveCampaignMarketCityId(db, {
    businessId,
    targetBusinessLocationId: branches.targetBusinessLocationId,
    destinationBusinessLocationId: branches.destinationBusinessLocationId,
  });
}
