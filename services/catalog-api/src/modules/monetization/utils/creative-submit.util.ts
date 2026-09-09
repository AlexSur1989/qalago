import { AdCreativeTargetType, AdCreativeType, AdModerationStatus } from '@prisma/client';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from '../errors/monetization.errors';

export type CreativeSubmitRecord = {
  type: AdCreativeType;
  title: string;
  imageUrl: string | null;
  buttonText: string | null;
  targetType: AdCreativeTargetType;
  targetId: string | null;
  targetUrl: string | null;
  moderationStatus: AdModerationStatus;
};

export function assertCreativeSubmittable(creative: CreativeSubmitRecord): void {
  if (
    creative.moderationStatus !== AdModerationStatus.DRAFT &&
    creative.moderationStatus !== AdModerationStatus.REJECTED
  ) {
    if (creative.moderationStatus === AdModerationStatus.PENDING) {
      return;
    }
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_NOT_EDITABLE,
      'Creative cannot be submitted in current status',
    );
  }

  if (!creative.title?.trim() || creative.title.trim().length < 2) {
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_INCOMPLETE,
      'Укажите заголовок баннера',
    );
  }

  if (creative.type === AdCreativeType.BANNER && !creative.imageUrl?.trim()) {
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_INCOMPLETE,
      'Загрузите изображение баннера',
    );
  }

  if (creative.targetType === AdCreativeTargetType.BUSINESS && !creative.targetId) {
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_INCOMPLETE,
      'Укажите цель перехода',
    );
  }

  if (creative.targetType === AdCreativeTargetType.PROMOTION && !creative.targetId) {
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_INCOMPLETE,
      'Укажите акцию для перехода',
    );
  }

  if (creative.targetType === AdCreativeTargetType.EXTERNAL_URL && !creative.targetUrl?.trim()) {
    monetizationBadRequest(
      MonetizationErrorCode.CREATIVE_INCOMPLETE,
      'Укажите URL для перехода',
    );
  }
}

export function assertCampaignCreativeLifecycleInvariant(input: {
  campaignStatus: string;
  creativeStatus: AdModerationStatus | null | undefined;
  requiresCreative: boolean;
}): void {
  if (!input.requiresCreative) return;
  if (input.campaignStatus !== 'PENDING_MODERATION') return;
  if (input.creativeStatus !== AdModerationStatus.DRAFT) return;
  throw new Error('Invalid lifecycle: PENDING_MODERATION campaign with DRAFT creative');
}
