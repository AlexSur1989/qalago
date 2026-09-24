import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';

void main() {
  late UserLocationGeolocatorBridge previousBridge;

  setUp(() {
    previousBridge = userLocationGeolocator;
    _FakeBridge.lastRequestCount = 0;
  });

  tearDown(() {
    userLocationGeolocator = previousBridge;
  });

  test('permission denied passive yields null without request', () async {
    userLocationGeolocator = _FakeBridge(
      permission: LocationPermission.denied,
    );
    final events = await userLocationStream().take(1).toList();
    expect(events, [null]);
    expect(_FakeBridge.lastRequestCount, 0);
  });

  test('service disabled yields null', () async {
    userLocationGeolocator = _FakeBridge(serviceEnabled: false);
    final events = await userLocationStream().take(1).toList();
    expect(events, [null]);
  });

  test('last-known available emits promptly', () async {
    userLocationGeolocator = _FakeBridge(
      lastKnown: _pos(51.243920, 51.379237),
      stream: const Stream.empty(),
    );
    final events = await userLocationStream().take(1).toList();
    expect(events, hasLength(1));
    expect(events.first!.latitude, 51.244);
    expect(events.first!.longitude, 51.379);
  });

  test('last-known then current emits both when different', () async {
    userLocationGeolocator = _FakeBridge(
      lastKnown: _pos(51.0, 51.0),
      currentValue: _pos(51.1, 51.2),
      stream: const Stream.empty(),
    );
    final events = await userLocationStream().take(2).toList();
    expect(events, hasLength(2));
    expect(events[0]!.latitude, 51.0);
    expect(events[1]!.latitude, 51.1);
  });

  test('last-known survives current timeout and stream continues', () async {
    userLocationGeolocator = _FakeBridge(
      lastKnown: _pos(51.243, 51.379),
      stream: Stream.fromIterable([_pos(51.25, 51.38)]),
    );
    final events = await userLocationStream().take(2).toList();
    expect(events, hasLength(2));
    expect(events[0]!.latitude, 51.243);
    expect(events[1]!.latitude, 51.25);
  });

  test('no last-known current success emits current', () async {
    userLocationGeolocator = _FakeBridge(
      currentValue: _pos(51.5, 51.6),
      stream: const Stream.empty(),
    );
    final events = await userLocationStream().take(1).toList();
    expect(events, [isNotNull]);
    expect(events.first!.latitude, 51.5);
  });

  test('no last-known current fails still subscribes to stream', () async {
    userLocationGeolocator = _FakeBridge(
      currentError: StateError('gps'),
      stream: Stream.fromIterable([_pos(51.2, 51.3)]),
    );
    final events = await userLocationStream().take(1).toList();
    expect(events, hasLength(1));
    expect(events.first!.latitude, 51.2);
  });

  test('duplicate last-known and current suppresses duplicate emission', () async {
    userLocationGeolocator = _FakeBridge(
      lastKnown: _pos(51.2278001, 51.3865001),
      currentValue: _pos(51.2278002, 51.3865002),
      stream: const Stream.empty(),
    );
    final events = await userLocationStream().take(2).toList();
    expect(events, hasLength(1));
    expect(events.first!.latitude, 51.228);
    expect(events.first!.longitude, 51.387);
  });

  test('live stream later emits after bootstrap', () async {
    userLocationGeolocator = _FakeBridge(
      lastKnown: _pos(51.0, 51.0),
      stream: Stream.fromIterable([_pos(51.2, 51.3)]),
    );
    final events = await userLocationStream().take(2).toList();
    expect(events, hasLength(2));
    expect(events[1]!.latitude, 51.2);
  });
}

Position _pos(double lat, double lng) => Position(
      latitude: lat,
      longitude: lng,
      timestamp: DateTime.utc(2026),
      accuracy: 10,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      headingAccuracy: 0,
      speed: 0,
      speedAccuracy: 0,
    );

class _FakeBridge extends UserLocationGeolocatorBridge {
  _FakeBridge({
    this.serviceEnabled = true,
    this.permission = LocationPermission.whileInUse,
    this.lastKnown,
    this.currentValue,
    this.currentError,
    this.stream = const Stream.empty(),
  });

  static int lastRequestCount = 0;

  final bool serviceEnabled;
  final LocationPermission permission;
  final Position? lastKnown;
  final Position? currentValue;
  final Object? currentError;
  final Stream<Position> stream;

  @override
  Future<bool> isLocationServiceEnabled() async => serviceEnabled;

  @override
  Future<LocationPermission> checkPermission() async => permission;

  @override
  Future<LocationPermission> requestPermission() async {
    lastRequestCount++;
    return LocationPermission.denied;
  }

  @override
  Future<Position?> getLastKnownPosition() async => lastKnown;

  @override
  Future<Position> getCurrentPositionWithTimeout(Duration timeout) async {
    if (currentError != null) {
      throw currentError!;
    }
    if (currentValue != null) {
      return currentValue!;
    }
    throw TimeoutException('no current', timeout);
  }

  @override
  Stream<Position> positionStream() => stream;
}
