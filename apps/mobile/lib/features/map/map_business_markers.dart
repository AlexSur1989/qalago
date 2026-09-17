import 'package:flutter/material.dart';

import '../../core/map/qalago_map_coordinate.dart';
import '../../core/map/qalago_map_marker.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/models.dart';
import '../../shared/utils/consumer_discovery_utils.dart';

/// Builds QalaGo map markers from catalog businesses (skips missing coordinates).
List<QalaGoMapMarker> buildBusinessMapMarkers({
  required List<BusinessModel> businesses,
  required String? selectedBusinessId,
  required void Function(BusinessModel business) onMarkerTap,
  required Widget Function({
    required BusinessModel business,
    required bool selected,
    required VoidCallback onTap,
  }) pinBuilder,
  QalaGoMapCoordinate? userLocation,
}) {
  final buildPin = pinBuilder;
  final markers = <QalaGoMapMarker>[];

  if (userLocation != null) {
    markers.add(
      QalaGoMapMarker(
        id: '__user_location__',
        position: userLocation,
        width: 28,
        height: 28,
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.kzBlue,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: AppTheme.textDark.withValues(alpha: 0.2),
                blurRadius: 8,
              ),
            ],
          ),
        ),
      ),
    );
  }

  for (final business in businessesWithCoordinates(businesses)) {
    final selected = business.id == selectedBusinessId;
    markers.add(
      QalaGoMapMarker(
        id: business.id,
        position: QalaGoMapCoordinate(
          latitude: business.latitude!,
          longitude: business.longitude!,
        ),
        width: 50,
        height: selected ? 72 : 68,
        child: buildPin(
          business: business,
          selected: selected,
          onTap: () => onMarkerTap(business),
        ),
      ),
    );
  }

  return markers;
}
