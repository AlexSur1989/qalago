import type { MonetizationCampaign } from '@/lib/api';

export type MonetizationPromoteSubject = 'business' | 'promotion';

export const PROMOTE_SUBJECT_PRODUCT_CODES: Record<
  MonetizationPromoteSubject,
  readonly string[]
> = {
  business: ['VIP_BANNER', 'FEATURED_BUSINESS', 'TOP_CATEGORY', 'BOOST'],
  promotion: ['PROMOTED_PROMOTION'],
};

export function filterProductsByPromoteSubject<T extends { code: string }>(
  products: T[],
  subject: MonetizationPromoteSubject,
): T[] {
  const allowed = new Set(PROMOTE_SUBJECT_PRODUCT_CODES[subject]);
  return products.filter((p) => allowed.has(p.code));
}

export type CampaignOwnerBucket =
  | 'active'
  | 'scheduled'
  | 'moderation'
  | 'finished'
  | 'other';

const BUCKET_ORDER: CampaignOwnerBucket[] = [
  'active',
  'scheduled',
  'moderation',
  'finished',
  'other',
];

export function campaignOwnerBucket(campaign: MonetizationCampaign): CampaignOwnerBucket {
  const effective = campaign.effectiveStatus ?? campaign.status;
  if (effective === 'ACTIVE') return 'active';
  if (effective === 'SCHEDULED') return 'scheduled';
  if (campaign.status === 'PENDING_MODERATION') return 'moderation';
  if (effective === 'COMPLETED') return 'finished';
  return 'other';
}

export function groupCampaignsByOwnerBucket(
  campaigns: MonetizationCampaign[],
): Record<CampaignOwnerBucket, MonetizationCampaign[]> {
  const groups: Record<CampaignOwnerBucket, MonetizationCampaign[]> = {
    active: [],
    scheduled: [],
    moderation: [],
    finished: [],
    other: [],
  };
  for (const c of campaigns) {
    groups[campaignOwnerBucket(c)].push(c);
  }
  return groups;
}

export function campaignOwnerBucketOrder(): readonly CampaignOwnerBucket[] {
  return BUCKET_ORDER;
}
