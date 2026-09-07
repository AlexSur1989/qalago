import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import 'business_traffic_source.dart';

/// Opens business detail with explicit traffic-source attribution (Stage 5H/5I).
void openBusiness(
  BuildContext context,
  String businessId,
  BusinessTrafficSource source, {
  String? searchQuery,
}) {
  final params = <String, String>{
    'source': source.apiValue,
  };
  if (source == BusinessTrafficSource.search &&
      searchQuery != null &&
      searchQuery.trim().isNotEmpty) {
    params['searchQuery'] = searchQuery.trim();
  }
  final uri = Uri(
    path: '/business/$businessId',
    queryParameters: params,
  );
  context.push(uri.toString());
}

BusinessTrafficSource parseBusinessTrafficSourceFromRoute(String? raw) =>
    BusinessTrafficSource.parseOrDirect(raw);

String? parseBusinessSearchQueryFromRoute(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  return raw.trim();
}
