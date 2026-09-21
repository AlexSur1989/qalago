import '../data/notification_model.dart';

/// Trusted client-side navigation targets (never from arbitrary payload URLs).
sealed class NotificationDestination {
  const NotificationDestination();
}

class NoNotificationDestination extends NotificationDestination {
  const NoNotificationDestination();
}

class ConsumerBusinessDetailsDestination extends NotificationDestination {
  const ConsumerBusinessDetailsDestination(this.businessId);
  final String businessId;
}

class ConsumerBusinessReviewsDestination extends NotificationDestination {
  const ConsumerBusinessReviewsDestination(this.businessId);
  final String businessId;
}

class ConsumerProfileReviewsDestination extends NotificationDestination {
  const ConsumerProfileReviewsDestination();
}

class ConsumerPromotionsDestination extends NotificationDestination {
  const ConsumerPromotionsDestination();
}

class OwnerReviewsDestination extends NotificationDestination {
  const OwnerReviewsDestination(this.businessId);
  final String businessId;
}

class OwnerPlanDestination extends NotificationDestination {
  const OwnerPlanDestination(this.businessId);
  final String businessId;
}

class OwnerTeamDestination extends NotificationDestination {
  const OwnerTeamDestination(this.businessId);
  final String businessId;
}

class OwnerMonetizationCampaignDestination extends NotificationDestination {
  const OwnerMonetizationCampaignDestination(this.campaignId);
  final String campaignId;
}

class BusinessApplicationFlowDestination extends NotificationDestination {
  const BusinessApplicationFlowDestination(this.applicationId);
  final String applicationId;
}

class BusinessClaimsListDestination extends NotificationDestination {
  const BusinessClaimsListDestination();
}

bool isTrustedEntityId(String? raw) {
  if (raw == null) return false;
  final id = raw.trim();
  if (id.isEmpty || id.length > 64) return false;
  if (id.contains('/') ||
      id.contains('\\') ||
      id.contains(':') ||
      id.toLowerCase().startsWith('http')) {
    return false;
  }
  return RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(id);
}

/// E.2 producers always attach `businessId` for REVIEW-target review events.
String? _reviewBusinessIdFromProducerPayload(Map<String, dynamic>? payload) {
  final raw = payload?['businessId'];
  if (raw is! String) return null;
  return isTrustedEntityId(raw) ? raw.trim() : null;
}

NotificationDestination resolveNotificationDestination(
  AppNotification notification,
) {
  final type = notification.type.trim();
  if (type.isEmpty || type == 'GENERAL') {
    return const NoNotificationDestination();
  }

  final targetType = notification.targetType?.trim();
  final targetId = isTrustedEntityId(notification.targetId)
      ? notification.targetId!.trim()
      : null;

  switch (type) {
    case 'NEW_REVIEW':
    case 'REVIEW_NEW':
      if (targetType == 'REVIEW') {
        final businessId = _reviewBusinessIdFromProducerPayload(
          notification.payload,
        );
        if (businessId != null) {
          return OwnerReviewsDestination(businessId);
        }
      }
      return const NoNotificationDestination();

    case 'REVIEW_REPLY':
      if (targetType == 'REVIEW') {
        final businessId = _reviewBusinessIdFromProducerPayload(
          notification.payload,
        );
        if (businessId != null) {
          return ConsumerBusinessReviewsDestination(businessId);
        }
      }
      return const NoNotificationDestination();

    case 'REVIEW_HIDDEN':
    case 'REVIEW_RESTORED':
      if (targetType == 'REVIEW' && targetId != null) {
        return const ConsumerProfileReviewsDestination();
      }
      return const NoNotificationDestination();

    case 'BUSINESS_APPROVED':
    case 'BUSINESS_BLOCKED':
      if (targetType == 'BUSINESS' && targetId != null) {
        return ConsumerBusinessDetailsDestination(targetId);
      }
      return const NoNotificationDestination();

    case 'BUSINESS_APPLICATION_APPROVED':
    case 'BUSINESS_APPLICATION_REJECTED':
      if (targetType == 'BUSINESS_APPLICATION' && targetId != null) {
        return BusinessApplicationFlowDestination(targetId);
      }
      return const NoNotificationDestination();

    case 'OWNERSHIP_CLAIM_APPROVED':
    case 'OWNERSHIP_CLAIM_REJECTED':
      if (targetType == 'OWNERSHIP_CLAIM' && targetId != null) {
        return const BusinessClaimsListDestination();
      }
      return const NoNotificationDestination();

    case 'BUSINESS_INVITATION_RECEIVED':
    case 'BUSINESS_INVITATION_ACCEPTED':
      if (targetType == 'BUSINESS' && targetId != null) {
        return OwnerTeamDestination(targetId);
      }
      return const NoNotificationDestination();

    case 'PLAN_ACTIVATED':
    case 'PLAN_EXPIRED':
      if (targetType == 'BUSINESS' && targetId != null) {
        return OwnerPlanDestination(targetId);
      }
      return const NoNotificationDestination();

    case 'AD_CAMPAIGN_APPROVED':
    case 'AD_CAMPAIGN_REJECTED':
      if (targetType == 'AD_CAMPAIGN' && targetId != null) {
        return OwnerMonetizationCampaignDestination(targetId);
      }
      return const NoNotificationDestination();

    case 'NEW_PROMOTION':
      if (targetType == 'PROMOTION' && targetId != null) {
        return const ConsumerPromotionsDestination();
      }
      if (targetType == 'BUSINESS' && targetId != null) {
        return ConsumerBusinessDetailsDestination(targetId);
      }
      return const NoNotificationDestination();

    default:
      return const NoNotificationDestination();
  }
}

bool notificationDestinationIsEmpty(NotificationDestination destination) {
  return destination is NoNotificationDestination;
}
