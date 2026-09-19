import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/location/user_location_provider.dart';

import '../../core/location/user_location_provider.dart';
import 'catalog_explicit_user_location.dart';
import 'search_catalog_sort.dart';
import 'search_filters.dart';

/// Builds GET /businesses geo query fields for Search (user GPS only for radius/nearest).
({double? lat, double? lng, double? radiusKm, String? sort}) buildSearchCatalogGeoParams({
  required WidgetRef ref,
  required SearchRadiusMode radiusMode,
  required SearchCatalogSort sort,
}) {
  return buildSearchCatalogGeoParamsFromUserGps(
    userGps: readCatalogUserGpsForGeoQueries(ref),
    radiusMode: radiusMode,
    sort: sort,
  );
}

@visibleForTesting
({double? lat, double? lng, double? radiusKm, String? sort})
    buildSearchCatalogGeoParamsFromUserGps({
  required UserPosition? userGps,
  required SearchRadiusMode radiusMode,
  required SearchCatalogSort sort,
}) {
  if (radiusMode != SearchRadiusMode.wholeCity) {
    if (userGps == null) {
      return (lat: null, lng: null, radiusKm: null, sort: sort.apiValue);
    }
    return (
      lat: userGps.latitude,
      lng: userGps.longitude,
      radiusKm: radiusMode.radiusKm,
      sort: sort.apiValue,
    );
  }

  if (sort == SearchCatalogSort.nearest) {
    if (userGps == null) {
      return (
        lat: null,
        lng: null,
        radiusKm: null,
        sort: SearchCatalogSort.recommended.apiValue,
      );
    }
    return (
      lat: userGps.latitude,
      lng: userGps.longitude,
      radiusKm: null,
      sort: sort.apiValue,
    );
  }

  return (lat: null, lng: null, radiusKm: null, sort: sort.apiValue);
}

bool searchRadiusModeRequiresUserGps(SearchRadiusMode mode) {
  return mode != SearchRadiusMode.wholeCity;
}

bool searchSortRequiresUserGps(SearchCatalogSort sort) {
  return sort == SearchCatalogSort.nearest;
}
