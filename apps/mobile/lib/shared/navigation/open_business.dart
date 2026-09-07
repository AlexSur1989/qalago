import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import 'business_traffic_source.dart';

/// Opens business detail with explicit traffic-source attribution (Stage 5H).
void openBusiness(
  BuildContext context,
  String businessId,
  BusinessTrafficSource source,
) {
  context.push(
    '/business/$businessId?source=${Uri.encodeComponent(source.apiValue)}',
  );
}

BusinessTrafficSource parseBusinessTrafficSourceFromRoute(String? raw) =>
    BusinessTrafficSource.parseOrDirect(raw);
