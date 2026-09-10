import { PlacementCapacityService } from '../placement-capacity.service';

/** Lightweight mock: forwards max/count to legacy prisma.adCampaign.count when configured. */
export function createMockPlacementCapacity(
  overrides: Partial<PlacementCapacityService> = {},
): PlacementCapacityService {
  return {
    resolveMaxActiveCampaigns: jest.fn().mockImplementation(async (db, scope) => {
      const placement = await db.adPlacement.findUnique({
        where: { id: scope.placementId },
      });
      return placement?.maxActiveCampaigns ?? 0;
    }),
    countInventoryUsage: jest.fn().mockImplementation(async (db) => {
      return db.adCampaign.count();
    }),
    findEarliestOverlappingRelease: jest.fn().mockResolvedValue(null),
    usesSharedCapacity: jest.fn().mockReturnValue(true),
    resolveCapacityStatuses: jest.fn(),
    isWindowAvailable: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as PlacementCapacityService;
}
