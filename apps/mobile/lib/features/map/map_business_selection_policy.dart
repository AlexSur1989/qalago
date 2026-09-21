import 'map_businesses_notifier.dart';
import 'map_physical_key.dart';

/// Pure rules for map location selection vs catalog/viewport state (C.6E / A.7.2).
abstract final class MapBusinessSelectionPolicy {
  /// Whether [selectedLocationId] should remain selected for the current map UI.
  static bool shouldRetainSelection({
    required String selectedLocationId,
    required MapBusinessesState businesses,
  }) {
    if (!businesses.byLocationId.containsKey(selectedLocationId)) {
      return false;
    }
    return businesses.mapLayerItems.any(
      (row) => mapPhysicalKey(row) == selectedLocationId,
    );
  }

  /// Native/list taps must ignore unknown or out-of-scope physical keys.
  static bool isSelectableLocationId({
    required String locationId,
    required MapBusinessesState businesses,
  }) {
    if (locationId.isEmpty) {
      return false;
    }
    return businesses.byLocationId.containsKey(locationId) &&
        businesses.mapLayerItems.any((row) => mapPhysicalKey(row) == locationId);
  }
}
