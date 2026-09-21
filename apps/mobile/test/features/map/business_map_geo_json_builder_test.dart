import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel business({
    required String id,
    String? locationId,
    double? lat,
    double? lng,
    String? categoryId,
    String? categoryTitle,
    String address = 'Addr',
  }) =>
      BusinessModel(
        id: id,
        locationId: locationId,
        title: 'Title $id',
        slug: 'slug-$id',
        address: address,
        latitude: lat,
        longitude: lng,
        categoryId: categoryId,
        categoryTitle: categoryTitle,
      );

  group('BusinessMapGeoJsonBuilder', () {
    test('valid business produces Point with locationId feature id', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'b1', locationId: 'loc-1', lat: 51.22, lng: 51.39),
        ],
      );
      final feature = (fc['features'] as List).single as Map<String, dynamic>;
      expect(feature['id'], 'loc-1');
      final props = feature['properties'] as Map<String, dynamic>;
      expect(props['businessId'], 'b1');
      expect(props['locationId'], 'loc-1');
    });

    test('legacy payload without locationId uses business id as feature id', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'b1', lat: 51.22, lng: 51.39)],
      );
      final feature = (fc['features'] as List).single as Map<String, dynamic>;
      expect(feature['id'], 'b1');
      expect((feature['properties'] as Map)['locationId'], 'b1');
    });

    test('one business three locations yields three features', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'b1', locationId: 'l1', lat: 51.1, lng: 51.1),
          business(id: 'b1', locationId: 'l2', lat: 51.2, lng: 51.2),
          business(id: 'b1', locationId: 'l3', lat: 51.3, lng: 51.3),
        ],
      );
      final features = fc['features'] as List;
      expect(features.length, 3);
      expect(features.map((f) => (f as Map)['id']).toList(), ['l1', 'l2', 'l3']);
    });

    test('duplicate locationId keeps first occurrence', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(
            id: 'b1',
            locationId: 'dup',
            lat: 51.1,
            lng: 51.2,
            address: 'First',
          ),
          business(
            id: 'b1',
            locationId: 'dup',
            lat: 51.9,
            lng: 51.9,
            address: 'Second',
          ),
        ],
      );
      expect((fc['features'] as List).length, 1);
    });

    test('same coordinates different locationIds yield two features', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'b1', locationId: 'l1', lat: 51.1, lng: 51.2),
          business(id: 'b1', locationId: 'l2', lat: 51.1, lng: 51.2),
        ],
      );
      expect((fc['features'] as List).length, 2);
    });

    test('selected location sets selected=1 on matching feature only', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'b1', locationId: 'l1', lat: 51.1, lng: 51.1),
          business(id: 'b1', locationId: 'l2', lat: 51.2, lng: 51.2),
        ],
        selectedLocationId: 'l2',
      );
      final features = fc['features'] as List;
      final l1Props = (features.first as Map)['properties'] as Map;
      final l2Props = (features.last as Map)['properties'] as Map;
      expect(l1Props['selected'], 0);
      expect(l2Props['selected'], 1);
    });

    test('excludes invalid coordinates', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'a', lat: 0, lng: 0)],
      );
      expect((fc['features'] as List).isEmpty, isTrue);
    });
  });
}
