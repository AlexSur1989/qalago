import type { ManageMenuItemRow, PromotionRow } from '@/lib/api';

export type ServiceItemEditForm = {
  title: string;
  description: string;
  titleKk: string;
  descriptionKk: string;
  price: string;
  groupId: string;
  isActive: boolean;
};

export type PromotionEditForm = {
  title: string;
  titleKk: string;
  description: string;
  descriptionKk: string;
  discountText: string;
};

export function serviceItemEditFormFromRow(item: ManageMenuItemRow): ServiceItemEditForm {
  return {
    title: item.title ?? '',
    description: item.description ?? '',
    titleKk: item.titleKk ?? '',
    descriptionKk: item.descriptionKk ?? '',
    price: item.price ?? '',
    groupId: item.sectionId ?? '',
    isActive: item.isActive,
  };
}

/** PATCH body for an existing service item (matches owner mobile update semantics). */
export function buildServiceItemUpdateBody(form: ServiceItemEditForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    titleKk: form.titleKk.trim(),
    descriptionKk: form.descriptionKk.trim(),
    groupId: form.groupId || null,
    isActive: form.isActive,
  };
  const desc = form.description.trim();
  if (desc) payload.description = desc;
  const price = form.price.trim();
  if (price) payload.price = price;
  return payload;
}

export function promotionEditFormFromRow(promo: PromotionRow): PromotionEditForm {
  return {
    title: promo.title ?? '',
    titleKk: promo.titleKk ?? '',
    description: promo.description ?? '',
    descriptionKk: promo.descriptionKk ?? '',
    discountText: promo.discountText ?? '',
  };
}

/** Organic promotion content edit — does not change status (toggle stays separate). */
export function buildPromotionUpdateBody(form: PromotionEditForm): Record<string, unknown> {
  return {
    title: form.title.trim(),
    titleKk: form.titleKk.trim(),
    description: form.description.trim(),
    descriptionKk: form.descriptionKk.trim(),
    discountText: form.discountText.trim(),
  };
}

export function canEditServiceItem(
  hasCatalogEdit: boolean,
): boolean {
  return hasCatalogEdit;
}

export function canEditPromotion(hasPromotionsEdit: boolean): boolean {
  return hasPromotionsEdit;
}
