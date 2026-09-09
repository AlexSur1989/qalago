import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/widgets/business_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/analytics_identity_provider.dart';
import '../services/analytics_impression_controller.dart';
import 'organic_viewability_tracker.dart';

final analyticsImpressionControllerProvider =
    Provider<AnalyticsImpressionController>((ref) {
  return AnalyticsImpressionController();
});

class TrackedBusinessCard extends ConsumerWidget {
  const TrackedBusinessCard({
    super.key,
    required this.business,
    required this.trafficSource,
    this.discoverySurface,
    this.searchQuery,
    this.position,
    this.onTap,
    this.sponsored = false,
    this.sponsoredLabel = 'Реклама',
  });

  final BusinessModel business;
  final BusinessTrafficSource trafficSource;
  final String? discoverySurface;
  final String? searchQuery;
  final int? position;
  final VoidCallback? onTap;
  final bool sponsored;
  final String sponsoredLabel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sponsored) {
      return BusinessCard(
        business: business,
        onTap: onTap,
        sponsored: sponsored,
        sponsoredLabel: sponsoredLabel,
      );
    }

    final surface = discoverySurface ?? _defaultSurface(trafficSource);
    final dedupeKey = AnalyticsImpressionController.businessKey(business.id, surface);
    final controller = ref.read(analyticsImpressionControllerProvider);

    return OrganicViewabilityTracker(
      trackingKey: ValueKey('biz-impression-${business.id}-$surface'),
      onQualifiedVisible: () {
        if (controller.hasSent(dedupeKey)) return;
        controller.markSent(dedupeKey);
        final repo = ref.read(catalogRepositoryProvider);
        final sessionId = ref.read(analyticsSessionIdProvider);
        unawaited(
          ref.read(analyticsVisitorIdProvider.future).then(
                (visitorId) => repo.trackBusinessImpression(
                  business.id,
                  trafficSource: trafficSource,
                  discoverySurface: surface,
                  searchQuery: searchQuery,
                  position: position,
                  visitorId: visitorId,
                  sessionId: sessionId,
                ),
              ),
        );
      },
      child: BusinessCard(
        business: business,
        onTap: onTap,
        sponsored: sponsored,
        sponsoredLabel: sponsoredLabel,
      ),
    );
  }

  String _defaultSurface(BusinessTrafficSource source) {
    switch (source) {
      case BusinessTrafficSource.home:
        return 'HOME_FEED';
      case BusinessTrafficSource.search:
        return 'SEARCH_RESULTS';
      case BusinessTrafficSource.category:
        return 'CATEGORY_LIST';
      case BusinessTrafficSource.map:
        return 'MAP_PIN';
      case BusinessTrafficSource.promotions:
        return 'PROMOTION_LIST';
      case BusinessTrafficSource.favorites:
        return 'FAVORITES_LIST';
      default:
        return 'OTHER';
    }
  }
}
