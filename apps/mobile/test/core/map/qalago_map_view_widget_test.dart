import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/osm_raster_map_config.dart';
import 'package:qalago_mobile/core/map/qalago_map_camera.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/map/qalago_map_view.dart';

void main() {
  testWidgets('QalaGoMapView shows OSM attribution', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          height: 200,
          width: 200,
          child: QalaGoMapView(
            interactionEnabled: false,
            initialCamera: const QalaGoMapCamera(
              center: QalaGoMapCoordinate(latitude: 51.23, longitude: 51.38),
              zoom: 12,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('OpenStreetMap'), findsWidgets);
    expect(OsmRasterMapConfig.attributionLabel, contains('OpenStreetMap'));
  });
}
