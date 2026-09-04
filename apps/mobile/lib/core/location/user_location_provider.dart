import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/city_provider.dart';

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

/// Live user position; updates when the user moves (~75 m by default).
final userLocationProvider = StreamProvider<UserPosition?>((ref) async* {
  if (kIsWeb && !await _ensureWebGeolocation()) {
    yield null;
    return;
  }

  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    yield null;
    return;
  }

  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    yield null;
    return;
  }

  try {
    final current = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.medium,
      ),
    );
    yield UserPosition(
      latitude: current.latitude,
      longitude: current.longitude,
    ).snapped;
  } catch (_) {
    // Stream may still deliver positions.
  }

  yield* Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.medium,
      distanceFilter: 75,
    ),
  ).map(
    (position) => UserPosition(
      latitude: position.latitude,
      longitude: position.longitude,
    ).snapped,
  );
});

/// User GPS or city center — always set so «Рядом с вами» uses geo + tier sort.
final nearbySearchPositionProvider = Provider<UserPosition>((ref) {
  final userPos = ref.watch(userLocationProvider).valueOrNull;
  if (userPos != null) return userPos;

  final city = ref.watch(cityProvider);
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
