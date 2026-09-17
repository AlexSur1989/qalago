import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_camera.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_provider.dart';
import 'package:qalago_mobile/core/map/qalago_map_view.dart';

void main() {
  testWidgets('controller move works after map is rendered', (tester) async {
    final controller = createQalaGoMapController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          height: 240,
          width: 240,
          child: QalaGoMapView(
            controller: controller,
            initialCamera: const QalaGoMapCamera(
              center: QalaGoMapCoordinate(latitude: 51.23, longitude: 51.38),
              zoom: 12,
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    expect(controller.zoom, 12);
    controller.move(
      const QalaGoMapCoordinate(latitude: 51.24, longitude: 51.39),
      13,
    );
    await tester.pump();
    expect(controller.zoom, 13);
  });
}
