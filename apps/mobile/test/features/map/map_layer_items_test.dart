import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/features/map/map_businesses_notifier.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel row({
    required String locationId,
    required double lat,
    required double lng,
  }) =>
      BusinessModel(
        id: 'b-shared',
        locationId: locationId,
        title: 'Shared',
        slug: 'shared',
        address: 'Addr $locationId',
        latitude: lat,
        longitude: lng,
        categoryId: 'cat-bars',
      );

  test('mapLayerItems uses lastFetchBounds so padded fetch keeps both branches', () {
    final l1 = row(locationId: 'loc-1', lat: 51.2298, lng: 51.3925);
    final l2 = row(locationId: 'loc-2', lat: 51.245, lng: 51.405);

    const visible = QalaGoMapBounds(
      southwest: QalaGoMapCoordinate(latitude: 51.228, longitude: 51.391),
      northeast: QalaGoMapCoordinate(latitude: 51.232, longitude: 51.395),
    );
    const fetch = QalaGoMapBounds(
      southwest: QalaGoMapCoordinate(latitude: 51.22, longitude: 51.38),
      northeast: QalaGoMapCoordinate(latitude: 51.25, longitude: 51.41),
    );

    final state = mapBusinessesStateForTest(items: [l1, l2]).copyWith(
      visibleBounds: visible,
      lastFetchBounds: fetch,
    );

    expect(state.items.length, 1);
    expect(state.mapLayerItems.length, 2);

    final geo = BusinessMapGeoJsonBuilder.buildFeatureCollection(
      businesses: state.mapLayerItems,
    );
    final features = geo['features'] as List<dynamic>;
    expect(features.length, 2);
    expect(features.map((f) => f['id'] as String).toSet(), {'loc-1', 'loc-2'});
  });
}
