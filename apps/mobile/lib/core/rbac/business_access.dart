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
  locations,
  menu,
  gallery,
  promotions,
  reviews,
}

class OwnerNavRequirement {
  const OwnerNavRequirement({
    this.anyOf = const [],
    this.ownerOnly = false,
  });

  final List<BusinessPermission> anyOf;
  final bool ownerOnly;
}

const _ownerNavRequirements = <OwnerNavItem, OwnerNavRequirement>{
  OwnerNavItem.analytics: OwnerNavRequirement(
    anyOf: [BusinessPermission.analyticsView],
  ),
  OwnerNavItem.promote: OwnerNavRequirement(
    anyOf: [BusinessPermission.adsManage],
  ),
  OwnerNavItem.plan: OwnerNavRequirement(
    anyOf: [BusinessPermission.paymentsView],
  ),
  OwnerNavItem.settings: OwnerNavRequirement(
    anyOf: [BusinessPermission.businessProfileEdit],
  ),
  OwnerNavItem.editProfile: OwnerNavRequirement(
    anyOf: [BusinessPermission.businessProfileEdit],
  ),
  OwnerNavItem.locations: OwnerNavRequirement(
    anyOf: [
      BusinessPermission.businessProfileEdit,
      BusinessPermission.businessHoursEdit,
    ],
  ),
  OwnerNavItem.menu: OwnerNavRequirement(
    anyOf: [BusinessPermission.catalogEdit],
  ),
  OwnerNavItem.gallery: OwnerNavRequirement(
    anyOf: [BusinessPermission.photosEdit],
  ),
  OwnerNavItem.promotions: OwnerNavRequirement(
    anyOf: [BusinessPermission.promotionsEdit],
  ),
  OwnerNavItem.reviews: OwnerNavRequirement(
    anyOf: [BusinessPermission.reviewsReply],
  ),
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

bool hasAnyPermission(
  BusinessAccess access,
  Iterable<BusinessPermission> permissions,
) {
  if (isOwner(access)) return true;
  for (final permission in permissions) {
    if (hasPermission(access, permission)) return true;
  }
  return false;
}

bool canAccessBusinessCabinet(String? userRole, List<MyBusinessEntry> entries) {
  if (canManageBusinessCabinet(userRole)) return true;
  return entries.isNotEmpty;
}

bool canAccessOwnerNavItem(BusinessAccess access, OwnerNavItem item) {
  if (item == OwnerNavItem.team) return isOwner(access);
  final requirement = _ownerNavRequirements[item];
  if (requirement == null) return true;
  if (requirement.ownerOnly) return isOwner(access);
  if (requirement.anyOf.isEmpty) return true;
  return hasAnyPermission(access, requirement.anyOf);
}

List<OwnerNavItem> filterOwnerNavByPermission(BusinessAccess access) {
  return OwnerNavItem.values
      .where((item) => canAccessOwnerNavItem(access, item))
      .toList();
}
