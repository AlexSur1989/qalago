import 'package:flutter/material.dart';

import '../../core/rbac/business_access.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';

/// Dashboard management grid + related shortcuts (6.14O.4 — aligned with Business Web route gates).
enum OwnerDashboardAction {
  editProfile,
  locations,
  menu,
  gallery,
  promotions,
  reviews,
  analytics,
  team,
}

class OwnerDashboardActionDef {
  const OwnerDashboardActionDef({
    required this.action,
    required this.icon,
    required this.anyOfPermissions,
    this.ownerOnly = false,
  });

  final OwnerDashboardAction action;
  final IconData icon;
  final List<BusinessPermission> anyOfPermissions;
  final bool ownerOnly;
}

const kOwnerDashboardActionDefs = <OwnerDashboardActionDef>[
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.editProfile,
    icon: Icons.storefront_outlined,
    anyOfPermissions: [BusinessPermission.businessProfileEdit],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.locations,
    icon: Icons.location_on_outlined,
    anyOfPermissions: [
      BusinessPermission.businessProfileEdit,
      BusinessPermission.businessHoursEdit,
    ],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.menu,
    icon: Icons.restaurant_menu,
    anyOfPermissions: [BusinessPermission.catalogEdit],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.gallery,
    icon: Icons.photo_library_outlined,
    anyOfPermissions: [BusinessPermission.photosEdit],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.promotions,
    icon: Icons.local_offer_outlined,
    anyOfPermissions: [BusinessPermission.promotionsEdit],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.reviews,
    icon: Icons.star_outline,
    anyOfPermissions: [BusinessPermission.reviewsReply],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.analytics,
    icon: Icons.bar_chart_outlined,
    anyOfPermissions: [BusinessPermission.analyticsView],
  ),
  OwnerDashboardActionDef(
    action: OwnerDashboardAction.team,
    icon: Icons.groups_outlined,
    anyOfPermissions: [],
    ownerOnly: true,
  ),
];

bool canShowOwnerDashboardAction(
  BusinessAccess? access,
  OwnerDashboardActionDef def,
) {
  if (access == null) return false;
  if (def.ownerOnly) return isOwner(access);
  if (def.anyOfPermissions.isEmpty) return true;
  return hasAnyPermission(access, def.anyOfPermissions);
}

List<OwnerDashboardActionDef> visibleOwnerDashboardActions(
  BusinessAccess? access,
) {
  return kOwnerDashboardActionDefs
      .where((def) => canShowOwnerDashboardAction(access, def))
      .toList(growable: false);
}

String ownerDashboardActionRoute(
  OwnerDashboardAction action, {
  required String businessId,
  required String encodedTitle,
}) {
  switch (action) {
    case OwnerDashboardAction.editProfile:
      return '/owner/edit/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.locations:
      return '/owner/locations/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.menu:
      return '/owner/menu/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.gallery:
      return '/owner/gallery/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.promotions:
      return '/owner/promotions/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.reviews:
      return '/owner/reviews/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.analytics:
      return '/owner/analytics/$businessId?title=$encodedTitle';
    case OwnerDashboardAction.team:
      return '/owner/team';
  }
}

String ownerDashboardActionLabel(
  AppLocalizations l10n,
  OwnerDashboardAction action,
) {
  switch (action) {
    case OwnerDashboardAction.editProfile:
      return l10n.ownerMgmtMyBusiness;
    case OwnerDashboardAction.locations:
      return l10n.ownerLocationsTitle;
    case OwnerDashboardAction.menu:
      return l10n.ownerPermissionCatalogEdit;
    case OwnerDashboardAction.gallery:
      return l10n.ownerGallery;
    case OwnerDashboardAction.promotions:
      return l10n.ownerMgmtPromotions;
    case OwnerDashboardAction.reviews:
      return l10n.ownerMgmtReviews;
    case OwnerDashboardAction.analytics:
      return l10n.ownerAnalyticsTitle;
    case OwnerDashboardAction.team:
      return l10n.ownerNavTeam;
  }
}

bool canShowOwnerMonetizationDashboardCard(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.adsManage);
}

bool canShowOwnerPlanDashboardCard(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.paymentsView);
}

bool canShowOwnerProfileDashboardCard(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.businessProfileEdit);
}

bool canShowOwnerPromotionsSummary(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.promotionsEdit);
}

bool canShowOwnerAnalyticsSummary(BusinessAccess? access) {
  if (access == null) return false;
  return hasPermission(access, BusinessPermission.analyticsView);
}
