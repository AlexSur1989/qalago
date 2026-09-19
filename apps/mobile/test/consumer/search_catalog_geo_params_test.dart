import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/features/search/search_catalog_geo_params.dart';
import 'package:qalago_mobile/features/search/search_catalog_sort.dart';
import 'package:qalago_mobile/features/search/search_filters.dart';

void main() {
  test('whole city omits coordinates and radius', () {
    final geo = buildSearchCatalogGeoParamsFromUserGps(
      userGps: null,
      radiusMode: SearchRadiusMode.wholeCity,
      sort: SearchCatalogSort.recommended,
    );
    expect(geo.lat, isNull);
    expect(geo.lng, isNull);
    expect(geo.radiusKm, isNull);
  });

  test('radius uses explicit user GPS not city center', () {
    final geo = buildSearchCatalogGeoParamsFromUserGps(
      userGps: const UserPosition(latitude: 51.22, longitude: 51.39),
      radiusMode: SearchRadiusMode.km3,
      sort: SearchCatalogSort.recommended,
    );
    expect(geo.radiusKm, 3);
    expect(geo.lat, 51.22);
    expect(geo.lng, 51.39);
  });

  test('radius without user GPS sends no geo fields', () {
    final geo = buildSearchCatalogGeoParamsFromUserGps(
      userGps: null,
      radiusMode: SearchRadiusMode.km5,
      sort: SearchCatalogSort.recommended,
    );
    expect(geo.lat, isNull);
    expect(geo.lng, isNull);
    expect(geo.radiusKm, isNull);
  });

  test('nearest without GPS falls back to recommended sort in params', () {
    final geo = buildSearchCatalogGeoParamsFromUserGps(
      userGps: null,
      radiusMode: SearchRadiusMode.wholeCity,
      sort: SearchCatalogSort.nearest,
    );
    expect(geo.sort, SearchCatalogSort.recommended.apiValue);
    expect(geo.lat, isNull);
  });
}
