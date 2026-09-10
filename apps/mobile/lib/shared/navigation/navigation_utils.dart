import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'business_traffic_source.dart';

/// Pops when navigation history exists; otherwise [context.go] to [fallbackLocation].
void qalagoPopOrGo(
  BuildContext context, {
  String? fallbackLocation,
}) {
  if (context.canPop()) {
    context.pop();
    return;
  }
  if (fallbackLocation != null && fallbackLocation.isNotEmpty) {
    context.go(fallbackLocation);
  }
}

void qalagoOwnerPopOrGo(BuildContext context) {
  qalagoPopOrGo(context, fallbackLocation: '/owner');
}

/// Safe consumer fallback when a business detail route has no stack (deep link).
String consumerFallbackRoute(
  BusinessTrafficSource source, {
  String? searchQuery,
}) {
  switch (source) {
    case BusinessTrafficSource.search:
      final q = searchQuery?.trim();
      if (q != null && q.isNotEmpty) {
        return Uri(path: '/search', queryParameters: {'q': q}).toString();
      }
      return '/search';
    case BusinessTrafficSource.category:
      return '/categories';
    case BusinessTrafficSource.map:
      return '/map';
    case BusinessTrafficSource.favorites:
      return '/favorites';
    case BusinessTrafficSource.promotions:
      return '/promotions';
    case BusinessTrafficSource.home:
    case BusinessTrafficSource.ad:
    case BusinessTrafficSource.direct:
    case BusinessTrafficSource.unknown:
      return '/home';
  }
}

void qalagoPopBusinessDetail(
  BuildContext context,
  BusinessTrafficSource source, {
  String? searchQuery,
}) {
  qalagoPopOrGo(
    context,
    fallbackLocation: consumerFallbackRoute(source, searchQuery: searchQuery),
  );
}

/// Theme-aligned AppBar back control for nested routes.
Widget qalagoBackLeading(
  BuildContext context, {
  String? fallbackLocation,
  VoidCallback? onPressed,
}) {
  return BackButton(
    onPressed: onPressed ??
        () => qalagoPopOrGo(context, fallbackLocation: fallbackLocation),
  );
}

bool qalagoShouldShowAppBarBack(BuildContext context, {String? fallbackLocation}) {
  return context.canPop() || (fallbackLocation != null && fallbackLocation.isNotEmpty);
}
