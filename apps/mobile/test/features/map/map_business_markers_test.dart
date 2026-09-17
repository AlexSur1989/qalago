import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/features/map/map_business_markers.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  BusinessModel business({
    required String id,
    double? lat,
    double? lng,
  }) =>
      BusinessModel(
        id: id,
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
        business(id: 'ok', lat: 51.1, lng: 51.2),
      ],
      selectedBusinessId: null,
      onMarkerTap: (_) {},
      pinBuilder: ({required business, required selected, required onTap}) =>
          Text(business.id),
    );
    expect(markers.length, 1);
    expect(markers.single.id, 'ok');
  });

  test('marker tap callback receives correct business', () {
    final target = business(id: 'tap-me', lat: 51.1, lng: 51.2);
    BusinessModel? tapped;
    final markers = buildBusinessMapMarkers(
      businesses: [target],
      selectedBusinessId: null,
      onMarkerTap: (b) => tapped = b,
      pinBuilder: ({required business, required selected, required onTap}) {
        return GestureDetector(key: Key(business.id), onTap: onTap, child: Text(business.id));
      },
    );
    expect(markers.single.id, 'tap-me');
    markers.single.child.key;
    final gesture = markers.single.child as GestureDetector;
    gesture.onTap?.call();
    expect(tapped?.id, 'tap-me');
  });

  test('includes user location marker when provided', () {
    final markers = buildBusinessMapMarkers(
      businesses: [business(id: 'b1', lat: 51.0, lng: 51.0)],
      selectedBusinessId: null,
      onMarkerTap: (_) {},
      userLocation: const QalaGoMapCoordinate(latitude: 51.5, longitude: 51.5),
      pinBuilder: ({required business, required selected, required onTap}) =>
          const SizedBox.shrink(),
    );
    expect(markers.length, 2);
    expect(markers.first.id, '__user_location__');
  });
}
