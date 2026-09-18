import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_controller.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_view.dart';
import 'package:qalago_mobile/features/location/widgets/business_location_picker.dart';

void main() {
  testWidgets('BusinessLocationPicker uses shared QalaGoMapView at initial camera',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: BusinessLocationPicker(
            initialLatitude: 51.220417,
            initialLongitude: 51.390364,
            instruction: 'Move map',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(QalaGoMapView), findsOneWidget);
    final map = tester.widget<QalaGoMapView>(find.byType(QalaGoMapView));
    expect(map.initialCamera.center.latitude, 51.220417);
    expect(map.initialCamera.center.longitude, 51.390364);
    expect(map.initialCamera.zoom, 16);
    expect(map.markers, isEmpty);
    expect(map.controller, isA<QalaGoMapController>());
    expect(find.byIcon(Icons.location_on), findsOneWidget);
  });

  testWidgets('confirm returns map center candidate after camera idle bounds',
      (tester) async {
    double? confirmedLat;
    double? confirmedLng;
    final pickerKey = GlobalKey<BusinessLocationPickerState>();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 400,
            child: BusinessLocationPicker(
              key: pickerKey,
              initialLatitude: 51.22,
              initialLongitude: 51.38,
              instruction: 'Move map',
              confirmLabel: 'Confirm',
              cancelLabel: 'Cancel',
              onConfirmed: (lat, lng) {
                confirmedLat = lat;
                confirmedLng = lng;
              },
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    pickerKey.currentState!.applyBoundsForTesting(
      const QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.25, longitude: 51.40),
        northeast: QalaGoMapCoordinate(latitude: 51.27, longitude: 51.42),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();

    expect(confirmedLat, closeTo(51.26, 0.0001));
    expect(confirmedLng, closeTo(51.41, 0.0001));
  });
}
