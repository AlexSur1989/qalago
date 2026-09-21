import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_business_markers.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel business({
    required String id,
    String? locationId,
    double? lat,
    double? lng,
  }) =>
      BusinessModel(
        id: id,
        locationId: locationId,
        title: 'Title $id',
        slug: 'slug-$id',
        address: 'Addr',
        latitude: lat,
        longitude: lng,
        categoryTitle: 'Кафе',
      );

  test('skips businesses without coordinates', () {
    final markers = buildBusinessMapMarkers(
      businesses: [
        business(id: 'no-coords'),
        business(id: 'ok', locationId: 'loc-1', lat: 51.1, lng: 51.2),
      ],
      selectedLocationId: null,
      onMarkerTap: (_) {},
      pinBuilder: ({required business, required selected, required onTap}) =>
          Text(business.id),
    );
    expect(markers.length, 1);
    expect(markers.single.id, 'loc-1');
  });

  test('two branches same business produce two marker ids', () {
    final markers = buildBusinessMapMarkers(
      businesses: [
        business(id: 'b1', locationId: 'l1', lat: 51.1, lng: 51.1),
        business(id: 'b1', locationId: 'l2', lat: 51.2, lng: 51.2),
      ],
      selectedLocationId: 'l2',
      onMarkerTap: (_) {},
      pinBuilder: ({required business, required selected, required onTap}) =>
          Text(business.locationId ?? business.id),
    );
    expect(markers.map((m) => m.id).toList(), ['l1', 'l2']);
  });

  test('marker tap callback receives correct business row', () {
    final target = business(id: 'b1', locationId: 'loc-tap', lat: 51.1, lng: 51.2);
    BusinessModel? tapped;
    final markers = buildBusinessMapMarkers(
      businesses: [target],
      selectedLocationId: null,
      onMarkerTap: (b) => tapped = b,
      pinBuilder: ({required business, required selected, required onTap}) {
        return GestureDetector(key: Key(business.id), onTap: onTap, child: Text(business.id));
      },
    );
    expect(markers.single.id, 'loc-tap');
    final gesture = markers.single.child as GestureDetector;
    gesture.onTap?.call();
    expect(tapped?.locationId, 'loc-tap');
    expect(tapped?.id, 'b1');
  });

  test('includes user location marker when provided', () {
    final markers = buildBusinessMapMarkers(
      businesses: [business(id: 'b1', locationId: 'l1', lat: 51.0, lng: 51.0)],
      selectedLocationId: null,
      onMarkerTap: (_) {},
      userLocation: const QalaGoMapCoordinate(latitude: 51.5, longitude: 51.5),
      pinBuilder: ({required business, required selected, required onTap}) =>
          const SizedBox.shrink(),
    );
    expect(markers.length, 2);
    expect(markers.first.id, '__user_location__');
  });
}
