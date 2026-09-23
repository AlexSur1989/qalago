import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../models/models.dart';
import 'business_traffic_source.dart';

/// Canonical business detail route (Stage 5H / A.7.6 / A.7.9.6).
Uri businessDetailRouteUri(
  String businessId,
  BusinessTrafficSource source, {
  String? searchQuery,
  String? selectedLocationId,
}) {
  final params = <String, String>{
    'source': source.apiValue,
  };
  if (selectedLocationId != null && selectedLocationId.trim().isNotEmpty) {
    params['locationId'] = selectedLocationId.trim();
  }
  if (source == BusinessTrafficSource.search &&
      searchQuery != null &&
      searchQuery.trim().isNotEmpty) {
    params['searchQuery'] = searchQuery.trim();
  }
  return Uri(
    path: '/business/$businessId',
    queryParameters: params,
  );
}

/// Opens business detail with explicit traffic-source attribution (Stage 5H/5I).
void openBusiness(
  BuildContext context,
  String businessId,
  BusinessTrafficSource source, {
  String? searchQuery,
  String? selectedLocationId,
}) {
  context.push(
    businessDetailRouteUri(
      businessId,
      source,
      searchQuery: searchQuery,
      selectedLocationId: selectedLocationId,
    ).toString(),
  );
}

/// In-detail branch switch: same business, new [selectedLocationId], no stack growth.
void switchBusinessDetailBranch(
  BuildContext context,
  String businessId,
  BusinessTrafficSource source, {
  String? searchQuery,
  required String selectedLocationId,
}) {
  context.replace(
    businessDetailRouteUri(
      businessId,
      source,
      searchQuery: searchQuery,
      selectedLocationId: selectedLocationId,
    ).toString(),
  );
}

/// Discovery list/search/nearby: preserve backend [BusinessModel.contextLocationId].
void openBusinessFromDiscovery(
  BuildContext context,
  BusinessModel business,
  BusinessTrafficSource source, {
  String? searchQuery,
}) {
  openBusiness(
    context,
    business.id,
    source,
    searchQuery: searchQuery,
    selectedLocationId: business.contextLocationId,
  );
}

/// City promotion feed: preserve [PromotionModel.contextLocationId].
void openBusinessFromPromotion(
  BuildContext context,
  PromotionModel promotion,
  BusinessTrafficSource source,
) {
  final business = promotion.business;
  if (business == null) return;
  openBusiness(
    context,
    business.id,
    source,
    selectedLocationId: promotion.contextLocationId,
  );
}

BusinessTrafficSource parseBusinessTrafficSourceFromRoute(String? raw) =>
    BusinessTrafficSource.parseOrDirect(raw);

String? parseBusinessSearchQueryFromRoute(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  return raw.trim();
}

String? parseSelectedLocationIdFromRoute(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  return raw.trim();
}
