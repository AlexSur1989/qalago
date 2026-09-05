import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../catalog/data/catalog_repository.dart';
import '../data/ad_models.dart';
import 'ad_impression_controller.dart';

final adImpressionControllerProvider = Provider<AdImpressionController>(
  (ref) => AdImpressionController(),
);

final adTrackingServiceProvider = Provider<AdTrackingService>((ref) {
  return AdTrackingService(
    catalog: ref.watch(catalogRepositoryProvider),
    impressions: ref.watch(adImpressionControllerProvider),
  );
});

class AdTrackingService {
  AdTrackingService({
    required CatalogRepository catalog,
    required AdImpressionController impressions,
  })  : _catalog = catalog,
        _impressions = impressions;

  final CatalogRepository _catalog;
  final AdImpressionController _impressions;

  Future<void> trackImpression(AdContext context) async {
    if (_impressions.hasSent(context.campaignId, context.placementId)) {
      return;
    }

    final result = await _catalog.sendAdEvent(
      campaignId: context.campaignId,
      placementCode: context.placementCode,
      sessionId: context.sessionId,
      type: 'AD_IMPRESSION',
      position: context.position,
    );

    if (result) {
      _impressions.markSent(context.campaignId, context.placementId);
    }
  }

  void trackEvent(AdContext context, String type) {
    unawaited(
      _catalog.sendAdEvent(
        campaignId: context.campaignId,
        placementCode: context.placementCode,
        sessionId: context.sessionId,
        type: type,
        position: context.position,
      ),
    );
  }
}
