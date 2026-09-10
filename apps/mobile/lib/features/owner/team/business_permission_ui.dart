import '../../../core/rbac/business_access.dart';

/// RU labels for business permissions (aligned with Business Web).
const businessPermissionLabelsRu = <BusinessPermission, String>{
  BusinessPermission.businessProfileEdit: 'Редактирование профиля',
  BusinessPermission.businessHoursEdit: 'График работы',
  BusinessPermission.catalogEdit: 'Товары и услуги',
  BusinessPermission.photosEdit: 'Фото и галерея',
  BusinessPermission.promotionsEdit: 'Акции',
  BusinessPermission.reviewsReply: 'Ответы на отзывы',
  BusinessPermission.analyticsView: 'Просмотр статистики',
  BusinessPermission.analyticsExport: 'Экспорт статистики',
  BusinessPermission.adsManage: 'Реклама и продвижение',
  BusinessPermission.paymentsView: 'Просмотр платежей',
};

String permissionLabelRu(String apiValue) {
  final permission = BusinessPermission.fromApi(apiValue);
  if (permission == null) return apiValue;
  return businessPermissionLabelsRu[permission] ?? apiValue;
}

String membershipRoleLabelRu(String role) {
  switch (role) {
    case 'OWNER':
      return 'Владелец';
    case 'MANAGER':
      return 'Менеджер';
    default:
      return role;
  }
}

String membershipStatusLabelRu(String status) {
  switch (status) {
    case 'ACTIVE':
      return 'Активен';
    case 'SUSPENDED':
      return 'Приостановлен';
    case 'REVOKED':
      return 'Доступ отозван';
    case 'INVITED':
      return 'Приглашён';
    default:
      return status;
  }
}

class PermissionPreset {
  const PermissionPreset({
    required this.id,
    required this.labelRu,
    required this.permissions,
    this.descriptionRu,
  });

  final String id;
  final String labelRu;
  final String? descriptionRu;
  final List<BusinessPermission> permissions;
}

/// Presets aligned with apps/business-web/lib/business-access.ts
const permissionPresets = <PermissionPreset>[
  PermissionPreset(
    id: 'manager',
    labelRu: 'Управляющий',
    descriptionRu: 'Операционный доступ без управления командой',
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
    labelRu: 'Контент-менеджер',
    descriptionRu: 'Профиль, каталог, фото и акции',
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
    labelRu: 'Маркетолог',
    descriptionRu: 'Акции, реклама и базовая аналитика',
    permissions: [
      BusinessPermission.promotionsEdit,
      BusinessPermission.adsManage,
      BusinessPermission.analyticsView,
    ],
  ),
  PermissionPreset(
    id: 'analytics',
    labelRu: 'Аналитик',
    descriptionRu: 'Просмотр и экспорт статистики',
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

String summarizePermissionsRu(List<String> apiValues, {int maxLabels = 3}) {
  if (apiValues.isEmpty) return '—';
  final labels = apiValues.map(permissionLabelRu).toList();
  if (labels.length <= maxLabels) return labels.join(' · ');
  final head = labels.take(maxLabels).join(' · ');
  return '$head · +${labels.length - maxLabels}';
}

bool isValidInviteEmail(String raw) {
  final email = raw.trim();
  if (email.isEmpty) return false;
  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
}
