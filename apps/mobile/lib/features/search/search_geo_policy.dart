import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/location/user_location_provider.dart';
import '../../core/providers/city_provider.dart';

/// True when passive user GPS is available for honest «Nearby» sort (not city-center fallback).
bool consumerHasRealNearbyGps(WidgetRef ref) {
  final userPos = ref.read(userLocationProvider).valueOrNull;
  if (userPos == null) return false;

  final city = ref.read(cityProvider);
  if (city.centerLat == null || city.centerLng == null) {
    return true;
  }

  final distanceFromCity = Geolocator.distanceBetween(
    userPos.latitude,
    userPos.longitude,
    city.centerLat!,
    city.centerLng!,
  );
  return distanceFromCity <= maxUserDistanceFromCityMeters;
}

/// Whether [position] is within plausibility range of the selected city center.
bool userPositionPlausibleForSelectedCity(WidgetRef ref, UserPosition position) {
  final city = ref.read(cityProvider);
  if (city.centerLat == null || city.centerLng == null) {
    return true;
  }
  final distanceFromCity = Geolocator.distanceBetween(
    position.latitude,
    position.longitude,
    city.centerLat!,
    city.centerLng!,
  );
  return distanceFromCity <= maxUserDistanceFromCityMeters;
}
