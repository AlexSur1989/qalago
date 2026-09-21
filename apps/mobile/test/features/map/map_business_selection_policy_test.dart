import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_business_selection_policy.dart';
import 'package:qalago_mobile/features/map/map_businesses_notifier.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel row({
    required String businessId,
    required String locationId,
    double lat = 51.22,
    double lng = 51.39,
    String address = 'A',
  }) =>
      BusinessModel(
        id: businessId,
        locationId: locationId,
        title: 'T',
        slug: 's',
        address: address,
        latitude: lat,
        longitude: lng,
      );

  QalaGoMapBounds boxAround(double lat, double lng) {
    return QalaGoMapBounds(
      southwest: QalaGoMapCoordinate(latitude: lat - 0.05, longitude: lng - 0.05),
      northeast: QalaGoMapCoordinate(latitude: lat + 0.05, longitude: lng + 0.05),
    );
  }

  group('MapBusinessSelectionPolicy', () {
    test('retains selection when location is in byLocationId and viewport', () {
      final b = row(businessId: 'b1', locationId: 'loc-a');
      final state = mapBusinessesStateForTest(items: [b]).copyWith(
        visibleBounds: boxAround(51.22, 51.39),
      );
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedLocationId: 'loc-a',
          businesses: state,
        ),
        isTrue,
      );
    });

    test('clears when location removed from byLocationId', () {
      final state = mapBusinessesStateForTest(items: []);
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedLocationId: 'gone',
          businesses: state,
        ),
        isFalse,
      );
    });

    test('clears when location not in viewport-filtered items', () {
      final b = row(businessId: 'b1', locationId: 'loc-a');
      final state = mapBusinessesStateForTest(items: [b]).copyWith(
        visibleBounds: boxAround(40, 40),
      );
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedLocationId: 'loc-a',
          businesses: state,
        ),
        isFalse,
      );
    });

    test('isSelectableLocationId distinguishes branches of same business', () {
      final l1 = row(
        businessId: 'b1',
        locationId: 'loc-1',
        lat: 51.22,
        address: 'One',
      );
      final l2 = row(
        businessId: 'b1',
        locationId: 'loc-2',
        lat: 51.23,
        address: 'Two',
      );
      final state = mapBusinessesStateForTest(items: [l1, l2]).copyWith(
        visibleBounds: QalaGoMapBounds(
          southwest: QalaGoMapCoordinate(latitude: 51.225, longitude: 51.34),
          northeast: QalaGoMapCoordinate(latitude: 51.235, longitude: 51.44),
        ),
      );
      expect(
        MapBusinessSelectionPolicy.isSelectableLocationId(
          locationId: 'loc-2',
          businesses: state,
        ),
        isTrue,
      );
      expect(
        MapBusinessSelectionPolicy.isSelectableLocationId(
          locationId: 'loc-1',
          businesses: state,
        ),
        isFalse,
      );
    });
  });
}
