import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_business_selection_policy.dart';
import 'package:qalago_mobile/features/map/map_businesses_notifier.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel biz(String id, {double lat = 51.22, double lng = 51.39}) =>
      BusinessModel(
        id: id,
        title: 'T$id',
        slug: 's$id',
        address: 'A',
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
    test('retains selection when business is in byId and viewport items', () {
      final b = biz('a');
      final state = mapBusinessesStateForTest(
        items: [b],
      ).copyWith(visibleBounds: boxAround(51.22, 51.39));
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedBusinessId: 'a',
          businesses: state,
        ),
        isTrue,
      );
    });

    test('clears when business removed from byId', () {
      final state = mapBusinessesStateForTest(items: []);
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedBusinessId: 'gone',
          businesses: state,
        ),
        isFalse,
      );
    });

    test('clears when business not in viewport-filtered items', () {
      final b = biz('a');
      final far = boxAround(40, 40);
      final state = mapBusinessesStateForTest(items: [b]).copyWith(
        visibleBounds: far,
      );
      expect(
        MapBusinessSelectionPolicy.shouldRetainSelection(
          selectedBusinessId: 'a',
          businesses: state,
        ),
        isFalse,
      );
    });

    test('isSelectableBusinessId requires byId and items', () {
      final b = biz('a');
      final inView = mapBusinessesStateForTest(items: [b]).copyWith(
        visibleBounds: boxAround(51.22, 51.39),
      );
      expect(
        MapBusinessSelectionPolicy.isSelectableBusinessId(
          businessId: 'a',
          businesses: inView,
        ),
        isTrue,
      );
      expect(
        MapBusinessSelectionPolicy.isSelectableBusinessId(
          businessId: 'a',
          businesses: mapBusinessesStateForTest(items: [b]).copyWith(
            visibleBounds: boxAround(40, 40),
          ),
        ),
        isFalse,
      );
    });
  });
}
