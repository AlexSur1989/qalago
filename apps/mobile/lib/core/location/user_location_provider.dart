import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/city_provider.dart';

/// Upper bound for passive fresh-position bootstrap (does not block live stream).
@visibleForTesting
const userLocationCurrentPositionTimeout = Duration(seconds: 12);

/// Injectable geolocator surface for tests (passive vs explicit permission).
@visibleForTesting
UserLocationGeolocatorBridge userLocationGeolocator =
    const UserLocationGeolocatorBridge();

class UserLocationGeolocatorBridge {
  const UserLocationGeolocatorBridge();

  Future<bool> isLocationServiceEnabled() => Geolocator.isLocationServiceEnabled();

  Future<LocationPermission> checkPermission() => Geolocator.checkPermission();

  Future<LocationPermission> requestPermission() =>
      Geolocator.requestPermission();

  Future<Position?> getLastKnownPosition() => Geolocator.getLastKnownPosition();

  Future<Position> getCurrentPosition() => Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
        ),
      );

  Future<Position> getCurrentPositionWithTimeout(Duration timeout) {
    return getCurrentPosition().timeout(timeout);
  }

  Stream<Position> positionStream() => Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          distanceFilter: 75,
        ),
      );
}

enum UserLocationPermissionMode { passive, explicit }

Stream<UserPosition?> userLocationStream({
  UserLocationPermissionMode permissionMode =
      UserLocationPermissionMode.passive,
}) async* {
  if (kIsWeb && !await _ensureWebGeolocation()) {
    yield null;
    return;
  }

  final bridge = userLocationGeolocator;
  final serviceEnabled = await bridge.isLocationServiceEnabled();
  if (!serviceEnabled) {
    yield null;
    return;
  }

  var permission = await bridge.checkPermission();
  if (permission == LocationPermission.denied &&
      permissionMode == UserLocationPermissionMode.explicit) {
    permission = await bridge.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    yield null;
    return;
  }

  UserPosition? lastEmitted;

  UserPosition _snapped(Position position) => UserPosition(
        latitude: position.latitude,
        longitude: position.longitude,
      ).snapped;

  void _dbg(String event) {
    if (kDebugMode) {
      debugPrint('[UserLocation] $event');
    }
  }

  try {
    final lastKnown = await bridge.getLastKnownPosition();
    if (lastKnown != null) {
      final snapped = _snapped(lastKnown);
      lastEmitted = snapped;
      _dbg('bootstrap lastKnown');
      yield snapped;
    }
  } catch (e) {
    _dbg('bootstrap lastKnown failed: $e');
  }

  try {
    final current = await bridge.getCurrentPositionWithTimeout(
      userLocationCurrentPositionTimeout,
    );
    final snapped = _snapped(current);
    if (snapped != lastEmitted) {
      lastEmitted = snapped;
      _dbg('bootstrap current');
      yield snapped;
    }
  } on TimeoutException {
    _dbg('bootstrap current timeout');
  } catch (e) {
    _dbg('bootstrap current failed: $e');
  }

  await for (final position in bridge.positionStream()) {
    final snapped = _snapped(position);
    if (snapped == lastEmitted) {
      continue;
    }
    lastEmitted = snapped;
    _dbg('stream');
    yield snapped;
  }
}

/// Explicit user-intent permission request (map/nearby actions — not Home render).
Future<bool> requestUserLocationPermission() async {
  var permission = await userLocationGeolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await userLocationGeolocator.requestPermission();
  }
  return permission == LocationPermission.always ||
      permission == LocationPermission.whileInUse;
}

class UserPosition {
  const UserPosition({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  /// Rounded coords (~100 m) to avoid excessive API refetches while walking.
  UserPosition get snapped {
    double snap(double value) => (value * 1000).roundToDouble() / 1000;
    return UserPosition(latitude: snap(latitude), longitude: snap(longitude));
  }

  @override
  bool operator ==(Object other) =>
      other is UserPosition &&
      other.latitude == latitude &&
      other.longitude == longitude;

  @override
  int get hashCode => Object.hash(latitude, longitude);
}

/// Passive user position — never prompts for permission (Home/Map initial render).
final userLocationProvider = StreamProvider<UserPosition?>(
  (ref) => userLocationStream(
    permissionMode: UserLocationPermissionMode.passive,
  ),
);

/// If user GPS is far from the selected city, search from city center instead.
/// Otherwise «Рядом с вами» returns 0 while admin still lists all city businesses.
const maxUserDistanceFromCityMeters = 25000;

/// User GPS or city center — always set so «Рядом с вами» uses geo + tier sort.
final nearbySearchPositionProvider = Provider<UserPosition>((ref) {
  final city = ref.watch(cityProvider);
  final userPos = ref.watch(userLocationProvider).valueOrNull;

  if (userPos != null &&
      city.centerLat != null &&
      city.centerLng != null) {
    final distanceFromCity = Geolocator.distanceBetween(
      userPos.latitude,
      userPos.longitude,
      city.centerLat!,
      city.centerLng!,
    );
    if (distanceFromCity <= maxUserDistanceFromCityMeters) {
      return userPos;
    }
  } else if (userPos != null) {
    return userPos;
  }

  if (city.centerLat != null && city.centerLng != null) {
    return UserPosition(
      latitude: city.centerLat!,
      longitude: city.centerLng!,
    );
  }

  return const UserPosition(latitude: 51.2278, longitude: 51.3865);
});

Future<bool> _ensureWebGeolocation() async {
  // Geolocator handles browser permission; always attempt on web.
  return true;
}

String formatDistanceMeters(int? meters) {
  if (meters == null) return '';
  if (meters < 1000) return '$meters м';
  final km = meters / 1000;
  return km >= 10 ? '${km.round()} км' : '${km.toStringAsFixed(1)} км';
}
