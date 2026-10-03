import '../../../../core/rbac/business_access.dart';
import '../../owner_plan_ui.dart';
import 'monetization_models.dart';

/// Business Web 6.13M.5 — promote subject split (product codes unchanged).
enum MonetizationPromoteSubject { business, promotion }

const _businessAdProductCodes = {
  'VIP_BANNER',
  'HOME_VIP_BANNER',
  'FEATURED_BUSINESS',
  'HOME_FEATURED',
  'TOP_CATEGORY',
  'CATEGORY_TOP',
  'BOOST',
  'CATEGORY_BOOST',
};

const _promotionAdProductCodes = {'PROMOTED_PROMOTION'};

/// Normalize API/placement aliases for label lookup only.
String normalizeMonetizationProductCode(String code) {
  return switch (code) {
    'HOME_VIP_BANNER' => 'VIP_BANNER',
    'HOME_FEATURED' => 'FEATURED_BUSINESS',
    'CATEGORY_TOP' => 'TOP_CATEGORY',
    'CATEGORY_BOOST' => 'BOOST',
    _ => code,
  };
}

bool isBusinessAdProductCode(String code) {
  return _businessAdProductCodes.contains(code);
}

bool isPromotionAdProductCode(String code) {
  return _promotionAdProductCodes.contains(code);
}

List<MonetizationProduct> filterMonetizationProductsBySubject(
  List<MonetizationProduct> products,
  MonetizationPromoteSubject subject,
) {
  return products.where((p) {
    switch (subject) {
      case MonetizationPromoteSubject.business:
        return isBusinessAdProductCode(p.code);
      case MonetizationPromoteSubject.promotion:
        return isPromotionAdProductCode(p.code);
    }
  }).toList(growable: false);
}

/// Plan pending (PlanPayment) — not ad order pending.
Map<String, dynamic>? findPlanPendingPayment(List<Map<String, dynamic>> payments) {
  return findPendingPlanPayment(payments);
}

int countAdOrdersAwaitingPayment(List<MonetizationOrder> orders) {
  return orders.where((o) => o.status == 'AWAITING_PAYMENT').length;
}

typedef CampaignStatusCounts = ({
  int active,
  int scheduled,
  int moderation,
  int completed,
});

CampaignStatusCounts countCampaignStatuses(List<MonetizationCampaign> campaigns) {
  var active = 0;
  var scheduled = 0;
  var moderation = 0;
  var completed = 0;
  for (final c in campaigns) {
    switch (c.displayStatus) {
      case 'ACTIVE':
        active++;
      case 'SCHEDULED':
        scheduled++;
      case 'PENDING_MODERATION':
        moderation++;
      case 'COMPLETED':
        completed++;
      default:
        break;
    }
  }
  return (
    active: active,
    scheduled: scheduled,
    moderation: moderation,
    completed: completed,
  );
}

/// VIP subscription tier must not be conflated with HOME VIP banner product.
bool planTierImpliesHomeVipBanner(String? planTier) => false;

int? readAdvertisingDiscountPercent(Map<String, dynamic>? planStatus) {
  if (planStatus == null) return null;
  final limits = planStatus['limits'];
  if (limits is! Map) return null;
  final raw = limits['advertisingDiscountPercent'];
  if (raw is! num || raw <= 0) return null;
  return raw.round();
}

bool canViewOwnerPlanOnMonetizationHub(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.paymentsView);
}

bool canManageOwnerAdvertising(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.adsManage);
}

/// Advertising package codes must not read as subscription plan tiers in UI copy.
bool isAdvertisingPackageCode(String code) {
  const packageCodes = {'START', 'BUSINESS', 'MAX', 'NEW_PLACE'};
  return packageCodes.contains(code);
}
