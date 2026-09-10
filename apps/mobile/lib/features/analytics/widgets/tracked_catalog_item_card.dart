import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../businesses/widgets/catalog_item_card.dart';
import '../providers/analytics_identity_provider.dart';
import '../services/analytics_impression_controller.dart';
import 'organic_viewability_tracker.dart';
import 'tracked_business_card.dart';

/// Catalog item impression via viewability; optional view on tap (Stage 6.5.1).
class TrackedCatalogItemCard extends ConsumerWidget {
  const TrackedCatalogItemCard({
    super.key,
    required this.businessId,
    required this.item,
    required this.surface,
    this.onTap,
  });

  final String businessId;
  final Map<String, dynamic> item;
  final String surface;
  final VoidCallback? onTap;

  String? get _catalogItemId => item['id'] as String?;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalogItemId = _catalogItemId;
    if (catalogItemId == null || catalogItemId.isEmpty) {
      return CatalogItemCard(item: item);
    }

    final dedupeKey =
        AnalyticsImpressionController.catalogKey(catalogItemId, surface);
    final controller = ref.read(analyticsImpressionControllerProvider);

    return OrganicViewabilityTracker(
      trackingKey: ValueKey('catalog-impression-$catalogItemId-$surface'),
      onQualifiedVisible: () {
        if (controller.hasSent(dedupeKey)) return;
        controller.markSent(dedupeKey);
        final repo = ref.read(catalogRepositoryProvider);
        final sessionId = ref.read(analyticsSessionIdProvider);
        unawaited(
          ref.read(analyticsVisitorIdProvider.future).then(
                (visitorId) => repo.trackCatalogItemImpression(
                  businessId,
                  catalogItemId: catalogItemId,
                  visitorId: visitorId,
                  sessionId: sessionId,
                ),
              ),
        );
      },
      child: CatalogItemCard(
        item: item,
        onTap: onTap == null
            ? null
            : () {
                final repo = ref.read(catalogRepositoryProvider);
                final sessionId = ref.read(analyticsSessionIdProvider);
                unawaited(
                  ref.read(analyticsVisitorIdProvider.future).then(
                        (visitorId) => repo.trackCatalogItemView(
                          businessId,
                          catalogItemId: catalogItemId,
                          visitorId: visitorId,
                          sessionId: sessionId,
                        ),
                      ),
                );
                onTap!();
              },
      ),
    );
  }
}
