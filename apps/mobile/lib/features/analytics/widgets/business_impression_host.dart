import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/navigation/business_traffic_source.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/analytics_identity_provider.dart';
import '../services/analytics_impression_controller.dart';
import 'organic_viewability_tracker.dart';
import 'tracked_business_card.dart';

/// Wraps any business list tile/card with one qualified organic impression per session.
class BusinessImpressionHost extends ConsumerWidget {
  const BusinessImpressionHost({
    super.key,
    required this.businessId,
    required this.trafficSource,
    required this.discoverySurface,
    required this.child,
    this.searchQuery,
    this.position,
  });

  final String businessId;
  final BusinessTrafficSource trafficSource;
  final String discoverySurface;
  final Widget child;
  final String? searchQuery;
  final int? position;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dedupeKey =
        AnalyticsImpressionController.businessKey(businessId, discoverySurface);
    final controller = ref.read(analyticsImpressionControllerProvider);

    return OrganicViewabilityTracker(
      trackingKey: ValueKey('biz-host-$businessId-$discoverySurface'),
      onQualifiedVisible: () {
        if (controller.hasSent(dedupeKey)) return;
        controller.markSent(dedupeKey);
        final repo = ref.read(catalogRepositoryProvider);
        final sessionId = ref.read(analyticsSessionIdProvider);
        unawaited(
          ref.read(analyticsVisitorIdProvider.future).then(
                (visitorId) => repo.trackBusinessImpression(
                  businessId,
                  trafficSource: trafficSource,
                  discoverySurface: discoverySurface,
                  searchQuery: searchQuery,
                  position: position,
                  visitorId: visitorId,
                  sessionId: sessionId,
                ),
              ),
        );
      },
      child: child,
    );
  }
}
