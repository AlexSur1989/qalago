import 'role_permissions.dart';

/// Business-scoped capability — distinct from system [UserRole].
enum BusinessPermission {
  businessProfileEdit('BUSINESS_PROFILE_EDIT'),
  businessHoursEdit('BUSINESS_HOURS_EDIT'),
  catalogEdit('CATALOG_EDIT'),
  photosEdit('PHOTOS_EDIT'),
  promotionsEdit('PROMOTIONS_EDIT'),
  reviewsReply('REVIEWS_REPLY'),
  analyticsView('ANALYTICS_VIEW'),
  analyticsExport('ANALYTICS_EXPORT'),
  adsManage('ADS_MANAGE'),
  paymentsView('PAYMENTS_VIEW');

  const BusinessPermission(this.apiValue);

  final String apiValue;

  static BusinessPermission? fromApi(String? value) {
    if (value == null || value.isEmpty) return null;
    for (final permission in BusinessPermission.values) {
      if (permission.apiValue == value) return permission;
    }
    return null;
  }
}

enum BusinessAccessRole {
  admin('ADMIN'),
  cityAdmin('CITY_ADMIN'),
  owner('OWNER'),
  manager('MANAGER');

  const BusinessAccessRole(this.apiValue);

  final String apiValue;

  static BusinessAccessRole? fromApi(String? value) {
    if (value == null || value.isEmpty) return null;
    for (final role in BusinessAccessRole.values) {
      if (role.apiValue == value) return role;
    }
    return null;
  }
}

class BusinessAccess {
  const BusinessAccess({
    required this.role,
    required this.permissions,
  });

  final BusinessAccessRole role;
  final List<BusinessPermission> permissions;

  factory BusinessAccess.fromJson(Map<String, dynamic> json) {
    final rawPermissions = json['permissions'] as List<dynamic>? ?? const [];
    return BusinessAccess(
      role: BusinessAccessRole.fromApi(json['role'] as String?) ??
          BusinessAccessRole.manager,
      permissions: rawPermissions
          .map((value) => BusinessPermission.fromApi(value as String?))
          .whereType<BusinessPermission>()
          .toList(),
    );
  }
}

class MyBusinessEntry {
  const MyBusinessEntry({
    required this.business,
    required this.access,
  });

  final Map<String, dynamic> business;
  final BusinessAccess access;

  String get businessId => business['id'] as String;

  factory MyBusinessEntry.fromJson(Map<String, dynamic> json) {
    return MyBusinessEntry(
      business: Map<String, dynamic>.from(json['business'] as Map),
      access: BusinessAccess.fromJson(
        Map<String, dynamic>.from(json['access'] as Map? ?? const {}),
      ),
    );
  }
}

/// Drawer and dashboard navigation keys for owner cabinet.
enum OwnerNavItem {
  overview,
  analytics,
  promote,
  messages,
  plan,
  team,
  settings,
  help,
  editProfile,
  menu,
  gallery,
  promotions,
  reviews,
}

const _ownerNavPermissionRequirements = <OwnerNavItem, BusinessPermission>{
  OwnerNavItem.analytics: BusinessPermission.analyticsView,
  OwnerNavItem.promote: BusinessPermission.adsManage,
  OwnerNavItem.plan: BusinessPermission.paymentsView,
  OwnerNavItem.editProfile: BusinessPermission.businessProfileEdit,
  OwnerNavItem.menu: BusinessPermission.catalogEdit,
  OwnerNavItem.gallery: BusinessPermission.photosEdit,
  OwnerNavItem.promotions: BusinessPermission.promotionsEdit,
  OwnerNavItem.reviews: BusinessPermission.reviewsReply,
};

List<BusinessPermission> normalizeBusinessPermissions(
  Iterable<BusinessPermission> permissions,
) {
  final set = permissions.toSet();
  if (set.contains(BusinessPermission.analyticsExport)) {
    set.add(BusinessPermission.analyticsView);
  }
  return set.toList();
}

bool isOwner(BusinessAccess access) =>
    access.role == BusinessAccessRole.owner ||
    access.role == BusinessAccessRole.admin ||
    access.role == BusinessAccessRole.cityAdmin;

bool hasPermission(BusinessAccess access, BusinessPermission permission) {
  if (isOwner(access)) return true;
  final normalized = normalizeBusinessPermissions(access.permissions);
  return normalized.contains(permission);
}

bool canAccessBusinessCabinet(String? userRole, List<MyBusinessEntry> entries) {
  if (canManageBusinessCabinet(userRole)) return true;
  return entries.isNotEmpty;
}

List<OwnerNavItem> filterOwnerNavByPermission(BusinessAccess access) {
  return OwnerNavItem.values.where((item) {
    if (item == OwnerNavItem.team) {
      return isOwner(access);
    }
    final required = _ownerNavPermissionRequirements[item];
    if (required == null) return true;
    return hasPermission(access, required);
  }).toList();
}
