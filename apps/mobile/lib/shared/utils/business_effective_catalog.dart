/// Consumer effective catalog & promotions (Stage 6.12A.7.8.5).
library;

import 'business_detail_utils.dart';
import 'business_effective_media.dart';

/// Resolved catalog preview for business detail (branch-effective when present).
class ConsumerDetailCatalogPreview {
  const ConsumerDetailCatalogPreview({
    required this.items,
    required this.totalCount,
    this.activeLocationId,
    required this.usedEffectiveSource,
  });

  final List<Map<String, dynamic>> items;
  final int totalCount;
  final String? activeLocationId;
  final bool usedEffectiveSource;
}

class ConsumerDetailPromotionsPreview {
  const ConsumerDetailPromotionsPreview({
    required this.items,
    required this.totalCount,
    this.activeLocationId,
    required this.usedEffectiveSource,
  });

  final List<Map<String, dynamic>> items;
  final int totalCount;
  final String? activeLocationId;
  final bool usedEffectiveSource;
}

List<Map<String, dynamic>> _previewItems(Map<String, dynamic>? block) {
  return (block?['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
}

ConsumerDetailCatalogPreview resolveConsumerDetailCatalogPreview(
  Map<String, dynamic> data,
) {
  final effective = previewBlock(data, 'effectiveCatalog');
  if (effective != null) {
    final items = _previewItems(effective);
    return ConsumerDetailCatalogPreview(
      items: items,
      totalCount: effective['totalCount'] as int? ?? items.length,
      activeLocationId: effective['activeLocationId'] as String?,
      usedEffectiveSource: true,
    );
  }

  final legacy = previewBlock(data, 'catalogPreview');
  final items = _previewItems(legacy);
  return ConsumerDetailCatalogPreview(
    items: items,
    totalCount: legacy?['totalCount'] as int? ?? items.length,
    activeLocationId: null,
    usedEffectiveSource: false,
  );
}

ConsumerDetailPromotionsPreview resolveConsumerDetailPromotionsPreview(
  Map<String, dynamic> data,
) {
  final effective = previewBlock(data, 'effectivePromotions');
  if (effective != null) {
    final items = _previewItems(effective);
    return ConsumerDetailPromotionsPreview(
      items: items,
      totalCount: effective['totalCount'] as int? ?? items.length,
      activeLocationId: effective['activeLocationId'] as String?,
      usedEffectiveSource: true,
    );
  }

  final legacy = previewBlock(data, 'promotionsPreview');
  final items = (legacy?['items'] as List<dynamic>? ??
          data['promotions'] as List<dynamic>? ??
          [])
      .cast<Map<String, dynamic>>();
  return ConsumerDetailPromotionsPreview(
    items: items,
    totalCount: legacy?['totalCount'] as int? ?? items.length,
    activeLocationId: null,
    usedEffectiveSource: false,
  );
}

/// Trust top-level [activeLocationId] when it disagrees with effective block (A.7.6 / A.7.8.5).
String? resolveEffectiveScopeLocationId({
  required Map<String, dynamic> data,
  String? effectiveActiveLocationId,
}) {
  final top = resolveDetailActiveLocationId(data);
  if (top != null &&
      top.isNotEmpty &&
      effectiveActiveLocationId != null &&
      effectiveActiveLocationId.isNotEmpty &&
      top != effectiveActiveLocationId) {
    return top;
  }
  return effectiveActiveLocationId ?? top;
}

String? resolveCatalogNavigationLocationId({
  required Map<String, dynamic> data,
  required ConsumerDetailCatalogPreview catalog,
}) {
  if (catalog.usedEffectiveSource) {
    return resolveEffectiveScopeLocationId(
      data: data,
      effectiveActiveLocationId: catalog.activeLocationId,
    );
  }
  return resolveDetailActiveLocationId(data);
}

String businessCatalogScopeKey({
  required String businessId,
  String? locationId,
}) {
  return '$businessId|${locationId ?? ''}';
}

String businessCatalogRoutePath({
  required String businessId,
  String? locationId,
}) {
  final trimmed = locationId?.trim();
  final params = <String, String>{};
  if (trimmed != null && trimmed.isNotEmpty) {
    params['locationId'] = trimmed;
  }
  return Uri(
    path: '/business/$businessId/catalog',
    queryParameters: params.isEmpty ? null : params,
  ).toString();
}

String? resolvePromotionsNavigationLocationId({
  required Map<String, dynamic> data,
  required ConsumerDetailPromotionsPreview promotions,
}) {
  if (promotions.usedEffectiveSource) {
    return resolveEffectiveScopeLocationId(
      data: data,
      effectiveActiveLocationId: promotions.activeLocationId,
    );
  }
  return resolveDetailActiveLocationId(data);
}

String businessPromotionsScopeKey({
  required String businessId,
  String? locationId,
}) {
  return '$businessId|promotions|${locationId ?? ''}';
}

String businessPromotionsRoutePath({
  required String businessId,
  String? locationId,
}) {
  final trimmed = locationId?.trim();
  final params = <String, String>{};
  if (trimmed != null && trimmed.isNotEmpty) {
    params['locationId'] = trimmed;
  }
  return Uri(
    path: '/business/$businessId/promotions',
    queryParameters: params.isEmpty ? null : params,
  ).toString();
}
