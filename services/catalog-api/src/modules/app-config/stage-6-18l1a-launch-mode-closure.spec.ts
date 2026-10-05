import {
  evaluateGooglePlayLaunchMonetizationGate,
  MonetizationMode,
} from '@qalago/shared-types';
import { PlatformFeaturesAdminService } from './platform-features-admin.service';

describe('6.18L.1A launch mode closure', () => {
  describe('evaluateGooglePlayLaunchMonetizationGate', () => {
    it('passes only for LAUNCH with purchases disabled and launch uplift', () => {
      const pass = evaluateGooglePlayLaunchMonetizationGate({
        monetizationMode: MonetizationMode.LAUNCH,
        canPurchasePlans: false,
        canPurchaseAds: false,
        launchAccessActive: true,
      });
      expect(pass.pass).toBe(true);
      expect(pass.expectedMode).toBe(MonetizationMode.LAUNCH);
    });

    it('fails for NORMAL', () => {
      const result = evaluateGooglePlayLaunchMonetizationGate({
        monetizationMode: MonetizationMode.NORMAL,
        canPurchasePlans: true,
        canPurchaseAds: true,
        launchAccessActive: false,
      });
      expect(result.pass).toBe(false);
      expect(result.actualMode).toBe(MonetizationMode.NORMAL);
    });

    it('fails for DISABLED', () => {
      const result = evaluateGooglePlayLaunchMonetizationGate({
        monetizationMode: MonetizationMode.DISABLED,
        canPurchasePlans: false,
        canPurchaseAds: false,
        launchAccessActive: false,
      });
      expect(result.pass).toBe(false);
    });
  });

  describe('PlatformFeaturesAdminService.getGooglePlayLaunchCheck', () => {
    it('reflects live platform-features monetization fields', async () => {
      const platformFeatures = {
        getPlatformFeatures: jest.fn().mockResolvedValue({
          platformFeatures: { businessTeamEnabled: false },
          configRevision: 3,
          monetizationMode: MonetizationMode.LAUNCH,
          canPurchasePlans: false,
          canPurchaseAds: false,
          launchAccessActive: true,
        }),
      };
      const admin = new PlatformFeaturesAdminService(
        {} as never,
        platformFeatures as never,
        {} as never,
        {} as never,
      );
      const check = await admin.getGooglePlayLaunchCheck();
      expect(check.pass).toBe(true);
    });
  });
});
