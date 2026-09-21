import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../owner/utils/owner_l10n.dart';
import '../data/notification_model.dart';

enum NotificationVisualCategory {
  review,
  reply,
  moderation,
  business,
  application,
  invitation,
  plan,
  promotion,
  ads,
  general,
}

class NotificationPresentation {
  const NotificationPresentation({
    required this.title,
    this.body,
    required this.category,
    required this.usedLegacyFallback,
  });

  final String title;
  final String? body;
  final NotificationVisualCategory category;
  final bool usedLegacyFallback;
}

const _knownNotificationTypes = {
  'GENERAL',
  'NEW_REVIEW',
  'REVIEW_REPLY',
  'REVIEW_HIDDEN',
  'REVIEW_RESTORED',
  'BUSINESS_APPROVED',
  'BUSINESS_BLOCKED',
  'BUSINESS_APPLICATION_APPROVED',
  'BUSINESS_APPLICATION_REJECTED',
  'OWNERSHIP_CLAIM_APPROVED',
  'OWNERSHIP_CLAIM_REJECTED',
  'BUSINESS_INVITATION_RECEIVED',
  'BUSINESS_INVITATION_ACCEPTED',
  'NEW_PROMOTION',
  'PLAN_ACTIVATED',
  'PLAN_EXPIRED',
  'AD_CAMPAIGN_APPROVED',
  'AD_CAMPAIGN_REJECTED',
  'REVIEW_NEW',
};

String? _payloadString(Map<String, dynamic>? payload, String key) {
  final value = payload?[key];
  if (value is String && value.trim().isNotEmpty) {
    return value.trim();
  }
  return null;
}

NotificationPresentation presentAppNotification(
  AppLocalizations l10n,
  AppNotification notification,
) {
  final type = notification.type.trim();
  if (type == 'GENERAL') {
    return _legacyFallback(notification, NotificationVisualCategory.general);
  }
  if (!_knownNotificationTypes.contains(type)) {
    return _legacyFallback(notification, NotificationVisualCategory.general);
  }

  final businessName = _payloadString(notification.payload, 'businessName');
  final publicReason = _payloadString(notification.payload, 'publicReason');
  final tierRaw =
      _payloadString(notification.payload, 'tier') ??
      _payloadString(notification.payload, 'planTier');
  final tierLabel = tierRaw != null ? ownerPlanTierLabel(l10n, tierRaw) : null;

  switch (type) {
    case 'NEW_REVIEW':
    case 'REVIEW_NEW':
      return NotificationPresentation(
        title: l10n.notificationNewReviewTitle,
        body: businessName != null
            ? l10n.notificationNewReviewBodyNamed(businessName)
            : l10n.notificationNewReviewBody,
        category: NotificationVisualCategory.review,
        usedLegacyFallback: false,
      );
    case 'REVIEW_REPLY':
      return NotificationPresentation(
        title: l10n.notificationReviewReplyTitle,
        body: businessName != null
            ? l10n.notificationReviewReplyBodyNamed(businessName)
            : l10n.notificationReviewReplyBody,
        category: NotificationVisualCategory.reply,
        usedLegacyFallback: false,
      );
    case 'REVIEW_HIDDEN':
      return NotificationPresentation(
        title: l10n.notificationReviewHiddenTitle,
        body: l10n.notificationReviewHiddenBody,
        category: NotificationVisualCategory.moderation,
        usedLegacyFallback: false,
      );
    case 'REVIEW_RESTORED':
      return NotificationPresentation(
        title: l10n.notificationReviewRestoredTitle,
        body: l10n.notificationReviewRestoredBody,
        category: NotificationVisualCategory.moderation,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_APPROVED':
      return NotificationPresentation(
        title: l10n.notificationBusinessApprovedTitle,
        body: businessName != null
            ? l10n.notificationBusinessApprovedBodyNamed(businessName)
            : l10n.notificationBusinessApprovedBody,
        category: NotificationVisualCategory.business,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_BLOCKED':
      return NotificationPresentation(
        title: l10n.notificationBusinessBlockedTitle,
        body: businessName != null
            ? l10n.notificationBusinessBlockedBodyNamed(businessName)
            : l10n.notificationBusinessBlockedBody,
        category: NotificationVisualCategory.business,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_APPLICATION_APPROVED':
      return NotificationPresentation(
        title: l10n.notificationBusinessApplicationApprovedTitle,
        body: l10n.notificationBusinessApplicationApprovedBody,
        category: NotificationVisualCategory.application,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_APPLICATION_REJECTED':
      return NotificationPresentation(
        title: l10n.notificationBusinessApplicationRejectedTitle,
        body: publicReason != null
            ? l10n.notificationBusinessApplicationRejectedBodyReason(
                publicReason,
              )
            : l10n.notificationBusinessApplicationRejectedBody,
        category: NotificationVisualCategory.application,
        usedLegacyFallback: false,
      );
    case 'OWNERSHIP_CLAIM_APPROVED':
      return NotificationPresentation(
        title: l10n.notificationOwnershipClaimApprovedTitle,
        body: businessName != null
            ? l10n.notificationOwnershipClaimApprovedBodyNamed(businessName)
            : l10n.notificationOwnershipClaimApprovedBody,
        category: NotificationVisualCategory.application,
        usedLegacyFallback: false,
      );
    case 'OWNERSHIP_CLAIM_REJECTED':
      return NotificationPresentation(
        title: l10n.notificationOwnershipClaimRejectedTitle,
        body: publicReason != null
            ? l10n.notificationOwnershipClaimRejectedBodyReason(publicReason)
            : l10n.notificationOwnershipClaimRejectedBody,
        category: NotificationVisualCategory.application,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_INVITATION_RECEIVED':
      return NotificationPresentation(
        title: l10n.notificationInvitationReceivedTitle,
        body: businessName != null
            ? l10n.notificationInvitationReceivedBodyNamed(businessName)
            : l10n.notificationInvitationReceivedBody,
        category: NotificationVisualCategory.invitation,
        usedLegacyFallback: false,
      );
    case 'BUSINESS_INVITATION_ACCEPTED':
      return NotificationPresentation(
        title: l10n.notificationInvitationAcceptedTitle,
        body: businessName != null
            ? l10n.notificationInvitationAcceptedBodyNamed(businessName)
            : l10n.notificationInvitationAcceptedBody,
        category: NotificationVisualCategory.invitation,
        usedLegacyFallback: false,
      );
    case 'PLAN_ACTIVATED':
      return NotificationPresentation(
        title: l10n.notificationPlanActivatedTitle,
        body: tierLabel != null
            ? l10n.notificationPlanActivatedBodyTier(tierLabel)
            : l10n.notificationPlanActivatedBody,
        category: NotificationVisualCategory.plan,
        usedLegacyFallback: false,
      );
    case 'PLAN_EXPIRED':
      return NotificationPresentation(
        title: l10n.notificationPlanExpiredTitle,
        body: l10n.notificationPlanExpiredBody,
        category: NotificationVisualCategory.plan,
        usedLegacyFallback: false,
      );
    case 'NEW_PROMOTION':
      return NotificationPresentation(
        title: l10n.notificationNewPromotionTitle,
        body: businessName != null
            ? l10n.notificationNewPromotionBodyNamed(businessName)
            : l10n.notificationNewPromotionBody,
        category: NotificationVisualCategory.promotion,
        usedLegacyFallback: false,
      );
    case 'AD_CAMPAIGN_APPROVED':
      return NotificationPresentation(
        title: l10n.notificationAdCampaignApprovedTitle,
        body: l10n.notificationAdCampaignApprovedBody,
        category: NotificationVisualCategory.ads,
        usedLegacyFallback: false,
      );
    case 'AD_CAMPAIGN_REJECTED':
      return NotificationPresentation(
        title: l10n.notificationAdCampaignRejectedTitle,
        body: publicReason != null
            ? l10n.notificationAdCampaignRejectedBodyReason(publicReason)
            : l10n.notificationAdCampaignRejectedBody,
        category: NotificationVisualCategory.ads,
        usedLegacyFallback: false,
      );
    default:
      return _legacyFallback(notification, NotificationVisualCategory.general);
  }
}

NotificationPresentation _legacyFallback(
  AppNotification notification,
  NotificationVisualCategory category,
) {
  final title = notification.title.trim();
  final bodyRaw = notification.body?.trim();
  return NotificationPresentation(
    title: title.isNotEmpty ? title : notification.type.replaceAll('_', ' '),
    body: bodyRaw != null && bodyRaw.isNotEmpty ? bodyRaw : null,
    category: category,
    usedLegacyFallback: true,
  );
}

IconData notificationCategoryIcon(NotificationVisualCategory category) {
  return switch (category) {
    NotificationVisualCategory.review => Icons.rate_review_outlined,
    NotificationVisualCategory.reply => Icons.reply_outlined,
    NotificationVisualCategory.moderation => Icons.shield_outlined,
    NotificationVisualCategory.business => Icons.storefront_outlined,
    NotificationVisualCategory.application => Icons.verified_outlined,
    NotificationVisualCategory.invitation => Icons.person_add_outlined,
    NotificationVisualCategory.plan => Icons.workspace_premium_outlined,
    NotificationVisualCategory.promotion => Icons.local_offer_outlined,
    NotificationVisualCategory.ads => Icons.campaign_outlined,
    NotificationVisualCategory.general => Icons.notifications_outlined,
  };
}
