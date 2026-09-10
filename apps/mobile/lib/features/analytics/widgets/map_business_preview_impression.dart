import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/navigation/business_traffic_source.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/analytics_identity_provider.dart';
import '../services/analytics_impression_controller.dart';
import 'tracked_business_card.dart';

/// Fires one MAP_PIN impression when the map preview panel is shown (Stage 6.5.1).
///
/// Semantics: user explicitly selected a business (pin or list item); not fired for
/// API-loaded markers or map pan/zoom alone.
class MapBusinessPreviewImpression extends ConsumerStatefulWidget {
  const MapBusinessPreviewImpression({
    super.key,
    required this.businessId,
    required this.child,
  });

  final String businessId;
  final Widget child;

  @override
  ConsumerState<MapBusinessPreviewImpression> createState() =>
      _MapBusinessPreviewImpressionState();
}

class _MapBusinessPreviewImpressionState
    extends ConsumerState<MapBusinessPreviewImpression> {
  static const _surface = 'MAP_PIN';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _trackOnce());
  }

  void _trackOnce() {
    if (!mounted) return;
    final dedupeKey =
        AnalyticsImpressionController.businessKey(widget.businessId, _surface);
    final controller = ref.read(analyticsImpressionControllerProvider);
    if (controller.hasSent(dedupeKey)) return;
    controller.markSent(dedupeKey);

    final repo = ref.read(catalogRepositoryProvider);
    final sessionId = ref.read(analyticsSessionIdProvider);
    unawaited(
      ref.read(analyticsVisitorIdProvider.future).then(
            (visitorId) => repo.trackBusinessImpression(
              widget.businessId,
              trafficSource: BusinessTrafficSource.map,
              discoverySurface: _surface,
              visitorId: visitorId,
              sessionId: sessionId,
            ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
