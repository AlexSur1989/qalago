import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/map/business_map_geo_json_builder.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel business({
    required String id,
    double? lat,
    double? lng,
    String? categoryId,
    String? categoryTitle,
  }) =>
      BusinessModel(
        id: id,
        title: 'Title $id',
        slug: 'slug-$id',
        address: 'Addr',
        latitude: lat,
        longitude: lng,
        categoryId: categoryId,
        categoryTitle: categoryTitle,
      );

  group('BusinessMapGeoJsonBuilder', () {
    test('valid business produces Point [lng, lat]', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'b1', lat: 51.22, lng: 51.39)],
      );
      expect(fc['type'], 'FeatureCollection');
      final features = fc['features'] as List;
      expect(features.length, 1);
      final feature = features.single as Map<String, dynamic>;
      expect(feature['id'], 'b1');
      expect(feature['geometry'], {
        'type': 'Point',
        'coordinates': [51.39, 51.22],
      });
      final props = feature['properties'] as Map<String, dynamic>;
      expect(props['businessId'], 'b1');
      expect(props['categoryKey'], isA<String>());
      expect(props['selected'], 0);
      expect(props.containsKey('title'), isFalse);
      expect(props.containsKey('phone'), isFalse);
    });

    test('excludes null latitude', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'a', lat: null, lng: 51.0)],
      );
      expect((fc['features'] as List).isEmpty, isTrue);
    });

    test('excludes null longitude', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'a', lat: 51.0, lng: null)],
      );
      expect((fc['features'] as List).isEmpty, isTrue);
    });

    test('excludes 0,0 sentinel', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'a', lat: 0, lng: 0)],
      );
      expect((fc['features'] as List).isEmpty, isTrue);
    });

    test('excludes out-of-range coordinates', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'a', lat: 91, lng: 51),
          business(id: 'b', lat: 51, lng: 181),
        ],
      );
      expect((fc['features'] as List).isEmpty, isTrue);
    });

    test('duplicate businessId keeps first occurrence', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(id: 'dup', lat: 51.1, lng: 51.2, categoryTitle: 'Кафе'),
          business(id: 'dup', lat: 51.9, lng: 51.9, categoryTitle: 'Бар'),
        ],
      );
      final features = fc['features'] as List;
      expect(features.length, 1);
      final coords =
          (features.single as Map)['geometry']['coordinates'] as List;
      expect(coords, [51.2, 51.1]);
    });

    test('selected business sets selected=1', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'sel', lat: 51.0, lng: 51.0)],
        selectedBusinessId: 'sel',
      );
      final props =
          ((fc['features'] as List).single as Map)['properties'] as Map;
      expect(props['selected'], 1);
    });

    test('selection update toggles selected property', () {
      final b = business(id: 'sel', lat: 51.0, lng: 51.0);
      final unselected = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [b],
        selectedBusinessId: null,
      );
      final selected = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [b],
        selectedBusinessId: 'sel',
      );
      final uProps =
          ((unselected['features'] as List).single as Map)['properties'] as Map;
      final sProps =
          ((selected['features'] as List).single as Map)['properties'] as Map;
      expect(uProps['selected'], 0);
      expect(sProps['selected'], 1);
      expect(uProps['businessId'], sProps['businessId']);
    });

    test('empty update clears features', () {
      final cleared = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: const [],
      );
      expect(cleared['features'], isEmpty);
    });

    test('empty input yields valid empty FeatureCollection', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: const [],
      );
      expect(fc['type'], 'FeatureCollection');
      expect(fc['features'], isEmpty);
    });

    test('categoryId omitted when null', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [business(id: 'x', lat: 1, lng: 2)],
      );
      final props =
          ((fc['features'] as List).single as Map)['properties'] as Map;
      expect(props.containsKey('categoryId'), isFalse);
    });

    test('categoryKey reflects category title bucket', () {
      final fc = BusinessMapGeoJsonBuilder.buildFeatureCollection(
        businesses: [
          business(
            id: 'x',
            lat: 1,
            lng: 2,
            categoryTitle: 'Фитнес клуб',
          ),
        ],
      );
      final props =
          ((fc['features'] as List).single as Map)['properties'] as Map;
      expect(props['categoryKey'], 'fitness');
    });
  });
}
