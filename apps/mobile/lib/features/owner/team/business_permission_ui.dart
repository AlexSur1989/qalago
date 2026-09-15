import '../../../core/rbac/business_access.dart';
import '../../../l10n/app_localizations.dart';
import '../utils/owner_l10n.dart';

String permissionLabel(AppLocalizations l10n, String apiValue) =>
    businessPermissionLabel(l10n, apiValue);

String membershipRoleLabelRu(AppLocalizations l10n, String role) =>
    membershipRoleLabel(l10n, role);

String membershipStatusLabelRu(AppLocalizations l10n, String status) =>
    membershipStatusLabel(l10n, status);

class PermissionPreset {
  const PermissionPreset({
    required this.id,
    required this.permissions,
  });

  final String id;
  final List<BusinessPermission> permissions;

  String label(AppLocalizations l10n) => permissionPresetLabel(l10n, id);

  String? description(AppLocalizations l10n) => permissionPresetDescription(l10n, id);
}

/// Presets aligned with apps/business-web/lib/business-access.ts
List<PermissionPreset> permissionPresets(AppLocalizations l10n) => [
      PermissionPreset(
        id: 'manager',
        permissions: [
          BusinessPermission.businessProfileEdit,
          BusinessPermission.businessHoursEdit,
          BusinessPermission.catalogEdit,
          BusinessPermission.photosEdit,
          BusinessPermission.promotionsEdit,
          BusinessPermission.reviewsReply,
          BusinessPermission.analyticsView,
          BusinessPermission.analyticsExport,
          BusinessPermission.adsManage,
          BusinessPermission.paymentsView,
        ],
      ),
      PermissionPreset(
        id: 'content',
        permissions: [
          BusinessPermission.businessProfileEdit,
          BusinessPermission.businessHoursEdit,
          BusinessPermission.catalogEdit,
          BusinessPermission.photosEdit,
          BusinessPermission.promotionsEdit,
        ],
      ),
      PermissionPreset(
        id: 'marketing',
        permissions: [
          BusinessPermission.promotionsEdit,
          BusinessPermission.adsManage,
          BusinessPermission.analyticsView,
        ],
      ),
      PermissionPreset(
        id: 'analytics',
        permissions: [
          BusinessPermission.analyticsView,
          BusinessPermission.analyticsExport,
        ],
      ),
    ];

List<BusinessPermission> allBusinessPermissions() =>
    BusinessPermission.values.toList();

List<String> permissionsToApiValues(Iterable<BusinessPermission> permissions) {
  return normalizeBusinessPermissions(permissions)
      .map((p) => p.apiValue)
      .toList();
}

List<BusinessPermission> apiValuesToPermissions(Iterable<String> values) {
  return values
      .map(BusinessPermission.fromApi)
      .whereType<BusinessPermission>()
      .toList();
}

String summarizePermissionsRu(AppLocalizations l10n, List<String> apiValues, {int maxLabels = 3}) =>
    summarizePermissions(l10n, apiValues, maxLabels: maxLabels);

bool isValidInviteEmail(String raw) {
  final email = raw.trim();
  if (email.isEmpty) return false;
  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
}
