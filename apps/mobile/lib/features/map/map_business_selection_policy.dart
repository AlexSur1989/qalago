import 'map_businesses_notifier.dart';

/// Pure rules for map business selection vs catalog/viewport state (C.6E).
abstract final class MapBusinessSelectionPolicy {
  /// Whether [selectedBusinessId] should remain selected for the current map UI.
  ///
  /// Clears when the business is absent from authoritative [byId], or when it
  /// is no longer in [MapBusinessesState.items] (viewport-filtered map payload).
  static bool shouldRetainSelection({
    required String selectedBusinessId,
    required MapBusinessesState businesses,
  }) {
    if (!businesses.byId.containsKey(selectedBusinessId)) {
      return false;
    }
    return businesses.items.any((b) => b.id == selectedBusinessId);
  }

  /// Native/list taps must ignore unknown or out-of-scope ids.
  static bool isSelectableBusinessId({
    required String businessId,
    required MapBusinessesState businesses,
  }) {
    if (businessId.isEmpty) {
      return false;
    }
    return businesses.byId.containsKey(businessId) &&
        businesses.items.any((b) => b.id == businessId);
  }
}
