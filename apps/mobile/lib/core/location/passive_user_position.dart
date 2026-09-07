import 'package:geolocator/geolocator.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';

/// Reads user position for analytics without requesting new permissions.
/// Never uses city-center or map-center fallbacks.
Future<UserPosition?> readPassiveUserPosition({
  UserPosition? activeStreamValue,
}) async {
  if (activeStreamValue != null) {
    return activeStreamValue;
  }

  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return null;
  }

  final permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    return null;
  }

  try {
    final position = await Geolocator.getLastKnownPosition();
    if (position == null) {
      return null;
    }
    return UserPosition(
      latitude: position.latitude,
      longitude: position.longitude,
    ).snapped;
  } catch (_) {
    return null;
  }
}

/// Uses only an already-active stream value — no Geolocator calls.
UserPosition? readCachedUserPositionOnly(UserPosition? activeStreamValue) =>
    activeStreamValue;
