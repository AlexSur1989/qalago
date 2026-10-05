export enum MonetizationMode {
  NORMAL = 'NORMAL',
  LAUNCH = 'LAUNCH',
  DISABLED = 'DISABLED',
}

/** Global feature flags backing {@link MonetizationMode} (FeatureFlagDefinition rows). */
export const MONETIZATION_PURCHASES_FLAG = 'monetizationPurchasesEnabled' as const;
export const FREE_LAUNCH_ACCESS_FLAG = 'freeLaunchAccessEnabled' as const;

export type MonetizationModeFlagKey =
  | typeof MONETIZATION_PURCHASES_FLAG
  | typeof FREE_LAUNCH_ACCESS_FLAG;

export const MONETIZATION_MODE_FLAG_KEYS: MonetizationModeFlagKey[] = [
  MONETIZATION_PURCHASES_FLAG,
  FREE_LAUNCH_ACCESS_FLAG,
];

export function resolveMonetizationMode(
  monetizationPurchasesEnabled: boolean,
  freeLaunchAccessEnabled: boolean,
): MonetizationMode {
  if (monetizationPurchasesEnabled) {
    return MonetizationMode.NORMAL;
  }
  if (freeLaunchAccessEnabled) {
    return MonetizationMode.LAUNCH;
  }
  return MonetizationMode.DISABLED;
}

export function flagsForMonetizationMode(mode: MonetizationMode): {
  monetizationPurchasesEnabled: boolean;
  freeLaunchAccessEnabled: boolean;
} {
  switch (mode) {
    case MonetizationMode.NORMAL:
      return { monetizationPurchasesEnabled: true, freeLaunchAccessEnabled: false };
    case MonetizationMode.LAUNCH:
      return { monetizationPurchasesEnabled: false, freeLaunchAccessEnabled: true };
    case MonetizationMode.DISABLED:
      return { monetizationPurchasesEnabled: false, freeLaunchAccessEnabled: false };
  }
}

export function isValidMonetizationModeCombination(
  monetizationPurchasesEnabled: boolean,
  freeLaunchAccessEnabled: boolean,
): boolean {
  if (monetizationPurchasesEnabled && freeLaunchAccessEnabled) {
    return false;
  }
  return true;
}

export interface MonetizationModePublicDto {
  monetizationMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
}

export function buildMonetizationModePublicDto(mode: MonetizationMode): MonetizationModePublicDto {
  const canPurchase = mode === MonetizationMode.NORMAL;
  return {
    monetizationMode: mode,
    canPurchasePlans: canPurchase,
    canPurchaseAds: canPurchase,
    launchAccessActive: mode === MonetizationMode.LAUNCH,
  };
}

export const MONETIZATION_DISABLED_ERROR_CODE = 'MONETIZATION_DISABLED' as const;

/** Non-destructive Google Play first-release gate (operator QA). */
export type GooglePlayLaunchMonetizationGateDto = {
  pass: boolean;
  expectedMode: MonetizationMode.LAUNCH;
  actualMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
};

export function evaluateGooglePlayLaunchMonetizationGate(input: {
  monetizationMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
}): GooglePlayLaunchMonetizationGateDto {
  const pass =
    input.monetizationMode === MonetizationMode.LAUNCH &&
    !input.canPurchasePlans &&
    !input.canPurchaseAds &&
    input.launchAccessActive;
  return {
    pass,
    expectedMode: MonetizationMode.LAUNCH,
    actualMode: input.monetizationMode,
    canPurchasePlans: input.canPurchasePlans,
    canPurchaseAds: input.canPurchaseAds,
    launchAccessActive: input.launchAccessActive,
  };
}
