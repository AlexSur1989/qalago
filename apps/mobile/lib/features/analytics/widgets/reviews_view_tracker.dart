import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../providers/analytics_identity_provider.dart';
import '../services/analytics_impression_controller.dart';
import 'organic_viewability_tracker.dart';
import 'tracked_business_card.dart';

/// Fires REVIEWS_VIEW once when the reviews block meets viewability (Stage 6.5.1).
class ReviewsViewTracker extends ConsumerWidget {
  const ReviewsViewTracker({
    super.key,
    required this.businessId,
    required this.child,
  });

  final String businessId;
  final Widget child;

  static const _surface = 'REVIEWS_BLOCK';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dedupeKey =
        AnalyticsImpressionController.businessKey(businessId, _surface);
    final controller = ref.read(analyticsImpressionControllerProvider);

    return OrganicViewabilityTracker(
      trackingKey: ValueKey('reviews-view-$businessId'),
      onQualifiedVisible: () {
        if (controller.hasSent(dedupeKey)) return;
        controller.markSent(dedupeKey);
        final repo = ref.read(catalogRepositoryProvider);
        final sessionId = ref.read(analyticsSessionIdProvider);
        unawaited(
          ref.read(analyticsVisitorIdProvider.future).then(
                (visitorId) => repo.trackReviewsView(
                  businessId,
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
