import '../../../core/rbac/business_access.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../business_onboarding/utils/onboarding_l10n.dart';
import '../owner_utils.dart';

/// Centralized owner / business / monetization UI labels (Stage 6.10B.3).

String ownerPlanTierLabel(AppLocalizations l10n, String? tier) {
  return switch (BusinessModel.normalizePlanTier(tier)) {
    'FREE' => l10n.ownerPlanTierFree,
    'BASIC' => l10n.ownerPlanTierBasic,
    'PREMIUM' => l10n.ownerPlanTierPremium,
    'VIP' => l10n.ownerPlanTierVip,
    final other => other,
  };
}

String ownerBusinessStatusLabel(AppLocalizations l10n, String status) {
  return switch (status.toUpperCase()) {
    'ACTIVE' => l10n.ownerStatusActive,
    'PENDING' => l10n.ownerStatusPendingModeration,
    'BLOCKED' => l10n.ownerStatusBlocked,
    _ => status,
  };
}

String ownerPromotionStatusLabel(AppLocalizations l10n, {required String? status, required bool liveNow}) {
  if (status != 'ACTIVE') return status ?? l10n.commonNoData;
  if (!liveNow) return l10n.ownerPromotionStatusExpired;
  return l10n.ownerPromotionStatusActive;
}

String ownerPromotionStatusLabelForModel(AppLocalizations l10n, PromotionModel promotion) =>
    ownerPromotionStatusLabel(
      l10n,
      status: promotion.status,
      liveNow: ownerIsPromotionLiveNow(promotion),
    );

String ownerPromotionFeedHint(AppLocalizations l10n) => l10n.ownerPromotionFeedHint;

String ownerNotificationTypeLabel(AppLocalizations l10n, String type) {
  return switch (type) {
    'NEW_REVIEW' => l10n.ownerNotificationReviewNew,
    'REVIEW_NEW' => l10n.ownerNotificationReviewNew,
    'REVIEW_REPLY' => l10n.ownerNotificationReviewReply,
    'REVIEW_HIDDEN' => l10n.ownerNotificationModeration,
    'REVIEW_RESTORED' => l10n.ownerNotificationModeration,
    'BUSINESS_APPLICATION_APPROVED' => l10n.ownerNotificationGeneral,
    'BUSINESS_APPLICATION_REJECTED' => l10n.ownerNotificationGeneral,
    'OWNERSHIP_CLAIM_APPROVED' => l10n.ownerNotificationGeneral,
    'OWNERSHIP_CLAIM_REJECTED' => l10n.ownerNotificationGeneral,
    'BUSINESS_INVITATION_RECEIVED' => l10n.ownerNotificationGeneral,
    'BUSINESS_INVITATION_ACCEPTED' => l10n.ownerNotificationGeneral,
    'AD_CAMPAIGN_APPROVED' => l10n.ownerNotificationPromotion,
    'AD_CAMPAIGN_REJECTED' => l10n.ownerNotificationPromotion,
    'MODERATION' => l10n.ownerNotificationModeration,
    'PROMOTION' => l10n.ownerNotificationPromotion,
    'PLAN_ACTIVATED' => l10n.ownerNotificationPlan,
    'PLAN_EXPIRED' => l10n.ownerNotificationPlan,
    'GENERAL' => l10n.ownerNotificationGeneral,
    _ => type.replaceAll('_', ' '),
  };
}

String ownerKpiLabel(AppLocalizations l10n, String type) {
  return switch (type) {
    'VIEW_BUSINESS' => l10n.ownerKpiViews,
    'CALL_CLICK' => l10n.ownerKpiCalls,
    'WHATSAPP_CLICK' => 'WhatsApp',
    'ROUTE_CLICK' => l10n.ownerKpiRoutes,
    'FAVORITE_ADD' => l10n.ownerKpiFavorites,
    _ => type,
  };
}

String ownerAnalyticsActionLabel(AppLocalizations l10n, String key) {
  return switch (key) {
    'calls' => l10n.ownerKpiCalls,
    'whatsapp' => 'WhatsApp',
    'routes' => l10n.ownerKpiRoutes,
    'website' => l10n.businessWebsite,
    'instagram' => l10n.businessInstagram,
    'favorites' => l10n.ownerAnalyticsFavorites,
    _ => key,
  };
}

String? ownerAnalyticsDeltaLabel(AppLocalizations l10n, num? value) {
  if (value == null) return null;
  final rounded = value.round();
  if (rounded > 0) return l10n.ownerAnalyticsDeltaPositive(rounded);
  if (rounded < 0) return l10n.ownerAnalyticsDeltaNegative(rounded);
  return l10n.ownerAnalyticsDeltaZero;
}

String? ownerAnalyticsPrimaryUpgradeMessage(AppLocalizations l10n, Map<String, dynamic> dashboard) {
  if (_ownerAnalyticsIsLocked(dashboard, 'actions')) {
    return ownerAnalyticsLockedMessage(dashboard, 'actions') ?? l10n.ownerAnalyticsUpgradeActions;
  }
  if (_ownerAnalyticsIsLocked(dashboard, 'sources')) {
    return l10n.ownerAnalyticsUpgradeSources;
  }
  if (_ownerAnalyticsIsLocked(dashboard, 'audience')) {
    return l10n.ownerAnalyticsUpgradeAudience;
  }
  return null;
}

bool _ownerAnalyticsIsLocked(Map<String, dynamic> dashboard, String sectionId) {
  final locked = dashboard['lockedSections'];
  if (locked is! List) return false;
  for (final item in locked) {
    if (item is Map && item['id'] == sectionId) return true;
  }
  return false;
}

String? ownerAnalyticsLockedMessage(Map<String, dynamic> dashboard, String sectionId) {
  final locked = dashboard['lockedSections'];
  if (locked is! List) return null;
  for (final item in locked) {
    if (item is Map && item['id'] == sectionId) {
      return item['message'] as String?;
    }
  }
  return null;
}

String businessPermissionLabel(AppLocalizations l10n, String apiValue) {
  final permission = BusinessPermission.fromApi(apiValue);
  if (permission == null) return apiValue;
  return businessPermissionLabelFromEnum(l10n, permission);
}

String businessPermissionLabelFromEnum(AppLocalizations l10n, BusinessPermission permission) {
  return switch (permission) {
    BusinessPermission.businessProfileEdit => l10n.ownerPermissionProfileEdit,
    BusinessPermission.businessHoursEdit => l10n.ownerPermissionHoursEdit,
    BusinessPermission.catalogEdit => l10n.ownerPermissionCatalogEdit,
    BusinessPermission.photosEdit => l10n.ownerPermissionPhotosEdit,
    BusinessPermission.promotionsEdit => l10n.ownerPermissionPromotionsEdit,
    BusinessPermission.reviewsReply => l10n.ownerPermissionReviewsReply,
    BusinessPermission.analyticsView => l10n.ownerPermissionAnalyticsView,
    BusinessPermission.analyticsExport => l10n.ownerPermissionAnalyticsExport,
    BusinessPermission.adsManage => l10n.ownerPermissionAdsManage,
    BusinessPermission.paymentsView => l10n.ownerPermissionPaymentsView,
  };
}

String membershipRoleLabel(AppLocalizations l10n, String role) =>
    membershipRoleLabelL10n(l10n, role);

String membershipStatusLabel(AppLocalizations l10n, String status) {
  return switch (status.toUpperCase()) {
    'ACTIVE' => l10n.ownerMembershipStatusActive,
    'SUSPENDED' => l10n.ownerMembershipStatusSuspended,
    'REVOKED' => l10n.ownerMembershipStatusRevoked,
    'INVITED' => l10n.ownerMembershipStatusInvited,
    _ => status,
  };
}

String permissionPresetLabel(AppLocalizations l10n, String presetId) {
  return switch (presetId) {
    'manager' => l10n.ownerPresetManager,
    'content' => l10n.ownerPresetContent,
    'marketing' => l10n.ownerPresetMarketing,
    'analytics' => l10n.ownerPresetAnalytics,
    _ => presetId,
  };
}

String? permissionPresetDescription(AppLocalizations l10n, String presetId) {
  return switch (presetId) {
    'manager' => l10n.ownerPresetManagerDesc,
    'content' => l10n.ownerPresetContentDesc,
    'marketing' => l10n.ownerPresetMarketingDesc,
    'analytics' => l10n.ownerPresetAnalyticsDesc,
    _ => null,
  };
}

String summarizePermissions(AppLocalizations l10n, List<String> apiValues, {int maxLabels = 3}) {
  if (apiValues.isEmpty) return l10n.commonNoData;
  final labels = apiValues.map((v) => businessPermissionLabel(l10n, v)).toList();
  if (labels.length <= maxLabels) return labels.join(' · ');
  final head = labels.take(maxLabels).join(' · ');
  return l10n.ownerPermissionsMore(head, labels.length - maxLabels);
}

String monetizationProductTitle(AppLocalizations l10n, String code) {
  return switch (code) {
    'BOOST' => l10n.monetizationProductBoost,
    'TOP_CATEGORY' => l10n.monetizationProductTopCategory,
    'PROMOTED_PROMOTION' => l10n.monetizationProductPromotedPromotion,
    'FEATURED_BUSINESS' => l10n.monetizationProductFeaturedBusiness,
    'VIP_BANNER' => l10n.monetizationProductVipBanner,
    _ => code,
  };
}

String monetizationProductDescription(AppLocalizations l10n, String code) {
  return switch (code) {
    'BOOST' => l10n.monetizationProductBoostDesc,
    'TOP_CATEGORY' => l10n.monetizationProductTopCategoryDesc,
    'PROMOTED_PROMOTION' => l10n.monetizationProductPromotedPromotionDesc,
    'FEATURED_BUSINESS' => l10n.monetizationProductFeaturedBusinessDesc,
    'VIP_BANNER' => l10n.monetizationProductVipBannerDesc,
    _ => l10n.monetizationProductDefaultDesc,
  };
}

String monetizationOrderStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'AWAITING_PAYMENT' => l10n.monetizationOrderAwaitingPayment,
    'PAID' => l10n.monetizationOrderPaid,
    'DRAFT' => l10n.onboardingStatusDraft,
    'CANCELLED' => l10n.onboardingStatusCancelled,
    'REFUNDED' => l10n.monetizationOrderRefunded,
    'PARTIALLY_REFUNDED' => l10n.monetizationOrderPartialRefund,
    _ => status,
  };
}

String monetizationCampaignStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'PENDING_MODERATION' => l10n.monetizationCampaignPendingModeration,
    'AWAITING_PAYMENT' => l10n.monetizationOrderAwaitingPayment,
    'SCHEDULED' => l10n.monetizationCampaignScheduled,
    'ACTIVE' => l10n.ownerPromotionStatusActive,
    'PAUSED' => l10n.monetizationCampaignPaused,
    'COMPLETED' => l10n.monetizationCampaignCompleted,
    'CANCELLED' => l10n.onboardingStatusCancelled,
    'REJECTED' => l10n.onboardingStatusRejected,
    _ => status,
  };
}

String monetizationCreativeModerationLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'DRAFT' => l10n.onboardingStatusDraft,
    'PENDING' => l10n.monetizationCreativePending,
    'APPROVED' => l10n.monetizationCreativeApproved,
    'REJECTED' => l10n.onboardingStatusRejected,
    _ => status,
  };
}

String monetizationAnalyticsActionLabel(AppLocalizations l10n, String type) {
  return switch (type) {
    'AD_CARD_OPEN' => l10n.monetizationAnalyticsCardOpen,
    'AD_CALL_CLICK' => l10n.ownerKpiCalls,
    'AD_WHATSAPP_CLICK' => 'WhatsApp',
    'AD_ROUTE_CLICK' => l10n.ownerKpiRoutes,
    'AD_WEBSITE_CLICK' => l10n.businessWebsite,
    'AD_INSTAGRAM_CLICK' => l10n.businessInstagram,
    'AD_PROMOTION_OPEN' => l10n.monetizationAnalyticsPromotionOpen,
    _ => type,
  };
}

String monetizationPurchaseStateLabel(AppLocalizations l10n, String state) {
  return switch (state) {
    'AVAILABLE' => l10n.monetizationPurchaseAvailable,
    'ACTIVE' => l10n.monetizationPurchaseActive,
    'SCHEDULED' => l10n.monetizationCampaignScheduled,
    'PENDING_PAYMENT' => l10n.monetizationOrderAwaitingPayment,
    'PENDING_APPROVAL' => l10n.monetizationCampaignPendingModeration,
    'SOLD_OUT' => l10n.monetizationPurchaseSoldOut,
    _ => state,
  };
}

String monetizationPurchasePrimaryActionLabel(AppLocalizations l10n, String action) {
  return switch (action) {
    'BUY' => l10n.monetizationActionBuy,
    'CONTINUE_PAYMENT' => l10n.monetizationActionContinuePayment,
    'RENEW' => l10n.monetizationActionRenew,
    _ => '',
  };
}

String monetizationReasonMessage(AppLocalizations l10n, String? code) {
  return switch (code) {
    'PENDING_ORDER_EXISTS' => l10n.monetizationReasonPendingOrder,
    'PURCHASE_CONFLICT' => l10n.monetizationReasonConflict,
    'ALREADY_ACTIVE' => l10n.monetizationReasonAlreadyActive,
    'ALREADY_SCHEDULED' => l10n.monetizationReasonAlreadyScheduled,
    'TARGET_ALREADY_PROMOTED' => l10n.monetizationReasonTargetPromoted,
    'CATEGORY_NOT_ELIGIBLE' => l10n.monetizationReasonCategoryIneligible,
    'PROMOTION_NOT_ELIGIBLE' => l10n.monetizationReasonPromotionIneligible,
    'PLACEMENT_SOLD_OUT' => l10n.monetizationReasonSoldOut,
    'PACKAGE_CONFLICT' => l10n.monetizationReasonPackageConflict,
    'RESERVATION_EXPIRED' => l10n.monetizationReasonReservationExpired,
    null || '' => l10n.monetizationReasonGeneric,
    _ => l10n.monetizationReasonGenericWithCode(code!),
  };
}

String invitationStatusMessage(AppLocalizations l10n, String status) {
  return switch (status) {
    'PENDING' => l10n.ownerInvitationStatusPending,
    'ACCEPTED' => l10n.ownerInvitationStatusAccepted,
    'REVOKED' => l10n.ownerInvitationStatusRevoked,
    'EXPIRED' => l10n.ownerInvitationStatusExpired,
    _ => status,
  };
}

String formatDurationLabel(AppLocalizations l10n, {int? durationDays, int? durationHours}) {
  if (durationDays != null && durationDays > 0) {
    return l10n.ownerDurationDays(durationDays, _daysLabel(l10n, durationDays));
  }
  if (durationHours != null && durationHours > 0) {
    return l10n.ownerDurationHours(durationHours);
  }
  return l10n.commonNoData;
}

String _daysLabel(AppLocalizations l10n, int days) {
  final mod10 = days % 10;
  final mod100 = days % 100;
  if (mod100 >= 11 && mod100 <= 14) return l10n.ownerDayUnitMany;
  if (mod10 == 1) return l10n.ownerDayUnitOne;
  if (mod10 >= 2 && mod10 <= 4) return l10n.ownerDayUnitFew;
  return l10n.ownerDayUnitMany;
}
