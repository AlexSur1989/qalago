/** Mirrors backend `plan-display.util` public labels for owner UI. */
export function internalTierToPublicLabel(tier: string): string {
  switch (tier) {
    case 'FREE':
      return 'Бесплатный';
    case 'BASIC':
      return 'Бизнес';
    case 'PREMIUM':
      return 'PRO';
    case 'VIP':
      return 'VIP';
    default:
      return tier;
  }
}
