import { MonetizationMode } from '@qalago/shared-types';

export function createMockMonetizationModeService(
  mode: MonetizationMode = MonetizationMode.NORMAL,
) {
  return {
    getMode: jest.fn().mockResolvedValue(mode),
    getPublicDto: jest.fn().mockResolvedValue({
      monetizationMode: mode,
      canPurchasePlans: mode === MonetizationMode.NORMAL,
      canPurchaseAds: mode === MonetizationMode.NORMAL,
      launchAccessActive: mode === MonetizationMode.LAUNCH,
    }),
    assertPurchasesAllowed: jest.fn().mockImplementation(async () => {
      if (mode !== MonetizationMode.NORMAL) {
        const { ForbiddenException } = await import('@nestjs/common');
        throw new ForbiddenException({ code: 'MONETIZATION_DISABLED' });
      }
    }),
    readGlobalModeFlags: jest.fn(),
    applyMode: jest.fn(),
    isPlanPurchaseAllowed: jest.fn(),
    isAdPurchaseAllowed: jest.fn(),
    isLaunchAccessActive: jest.fn(),
  };
}
