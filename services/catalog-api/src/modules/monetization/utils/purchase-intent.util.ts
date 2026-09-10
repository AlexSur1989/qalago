import { MonetizationProductType } from '@prisma/client';
import { PACKAGE_PRODUCT_CODE } from '../constants/monetization.constants';

/** Normalized checkout intent used for pending-order dedupe (Stage 6.7B). */
export type PurchaseIntent = {
  kind: 'product' | 'package';
  businessId: string;
  productCode?: string;
  packageCode?: string;
  durationHours?: number | null;
  durationDays?: number | null;
  categoryId?: string | null;
  promotionId?: string | null;
  creativeId?: string | null;
  /** ISO date string (date-only normalized) or null for ASAP */
  desiredStartAt?: string | null;
};

export function normalizeDesiredStartKey(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function buildProductPurchaseIntent(input: {
  businessId: string;
  productCode: string;
  durationHours?: number | null;
  durationDays?: number | null;
  categoryId?: string | null;
  promotionId?: string | null;
  creativeId?: string | null;
  desiredStartAt?: string | null;
}): PurchaseIntent {
  return {
    kind: 'product',
    businessId: input.businessId,
    productCode: input.productCode,
    durationHours: input.durationHours ?? null,
    durationDays: input.durationDays ?? null,
    categoryId: input.categoryId ?? null,
    promotionId: input.promotionId ?? null,
    creativeId: input.creativeId ?? null,
    desiredStartAt: normalizeDesiredStartKey(input.desiredStartAt),
  };
}

export function buildPackagePurchaseIntent(input: {
  businessId: string;
  packageCode: string;
  promotionId?: string | null;
  creativeId?: string | null;
  desiredStartAt?: string | null;
}): PurchaseIntent {
  return {
    kind: 'package',
    businessId: input.businessId,
    packageCode: input.packageCode,
    promotionId: input.promotionId ?? null,
    creativeId: input.creativeId ?? null,
    desiredStartAt: normalizeDesiredStartKey(input.desiredStartAt),
  };
}

function parseItemMeta(metadata: unknown): {
  packageCode?: string;
  promotionId?: string;
  creativeId?: string;
  categoryId?: string;
  desiredStartAt?: string;
} {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return metadata as {
    packageCode?: string;
    promotionId?: string;
    creativeId?: string;
    categoryId?: string;
    desiredStartAt?: string;
  };
}

export function orderMatchesPurchaseIntent(
  order: {
    businessId: string;
    items: Array<{
      durationHours: number | null;
      durationDays: number | null;
      metadata: unknown;
      product: { code: string; type: MonetizationProductType };
    }>;
  },
  intent: PurchaseIntent,
): boolean {
  if (order.businessId !== intent.businessId) return false;

  if (intent.kind === 'package') {
    if (order.items.length !== 1) return false;
    const item = order.items[0];
    if (item.product.code !== PACKAGE_PRODUCT_CODE) return false;
    const meta = parseItemMeta(item.metadata);
    if (meta.packageCode !== intent.packageCode) return false;
    if ((meta.promotionId ?? null) !== (intent.promotionId ?? null)) return false;
    if ((meta.creativeId ?? null) !== (intent.creativeId ?? null)) return false;
    return (
      normalizeDesiredStartKey(meta.desiredStartAt) === intent.desiredStartAt
    );
  }

  if (order.items.length !== 1) return false;
  const item = order.items[0];
  const meta = parseItemMeta(item.metadata);
  if (item.product.code !== intent.productCode) return false;
  if (item.durationHours !== (intent.durationHours ?? null)) return false;
  if (item.durationDays !== (intent.durationDays ?? null)) return false;
  if ((meta.categoryId ?? null) !== (intent.categoryId ?? null)) return false;
  if ((meta.promotionId ?? null) !== (intent.promotionId ?? null)) return false;
  if ((meta.creativeId ?? null) !== (intent.creativeId ?? null)) return false;
  return normalizeDesiredStartKey(meta.desiredStartAt) === intent.desiredStartAt;
}

export function purchaseIntentFingerprint(intent: PurchaseIntent): string {
  const parts = [
    intent.kind,
    intent.businessId,
    intent.productCode ?? '',
    intent.packageCode ?? '',
    String(intent.durationHours ?? ''),
    String(intent.durationDays ?? ''),
    intent.categoryId ?? '',
    intent.promotionId ?? '',
    intent.creativeId ?? '',
    intent.desiredStartAt ?? '',
  ];
  return parts.join('|');
}
