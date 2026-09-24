import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../map_viewport_debug_log.dart';
import '../qalago_map_business_layer_sink.dart';
import '../qalago_map_coordinate.dart';
import '../qalago_map_user_location_geojson.dart';
import '../qalago_map_user_location_layer_ids.dart';
import '../qalago_map_user_location_layer_style.dart';
import '../qalago_native_map_user_location_config.dart';
import '../qalago_map_renderer.dart';

/// MapLibre GeoJSON source + CircleLayer for passive user GPS (MAP-LOCATION.1).
class QalaGoMapUserLocationLayerController {
  QalaGoMapUserLocationLayerController({QalaGoMapBusinessLayerSink? sinkForTesting})
      : _testSink = sinkForTesting;

  final QalaGoMapBusinessLayerSink? _testSink;

  bool _sourceInstalled = false;
  bool _layerInstalled = false;
  QalaGoMapCoordinate? _latestPosition;

  bool get sourceInstalled => _sourceInstalled;

  @visibleForTesting
  bool get layerInstalled => _layerInstalled;

  @visibleForTesting
  QalaGoMapCoordinate? get latestPosition => _latestPosition;

  QalaGoMapBusinessLayerSink _sink(MapLibreMapController map) {
    return _testSink ?? MapLibreQalaGoMapBusinessLayerSink(map);
  }

  bool _enabled(QalaGoMapRenderer renderer) =>
      QalaGoNativeMapUserLocationConfig.enabledForRenderer(renderer);

  Future<void> onStyleLoaded(
    MapLibreMapController map, {
    QalaGoMapCoordinate? userLocation,
    QalaGoMapRenderer renderer = QalaGoMapRenderer.mapLibre,
  }) async {
    if (!_enabled(renderer)) {
      return;
    }
    await _tearDown(map);
    await _installSourceAndLayer(map);
    mapViewportDbg(
      'MAPDBG userLocationLayer styleReady hasLocation=${userLocation != null}',
    );
    await syncUserLocation(map, userLocation, renderer: renderer);
    mapViewportDbg('MAPDBG userLocationLayer initialized');
  }

  Future<void> syncUserLocation(
    MapLibreMapController map,
    QalaGoMapCoordinate? position, {
    QalaGoMapRenderer renderer = QalaGoMapRenderer.mapLibre,
  }) async {
    if (!_enabled(renderer)) {
      return;
    }
    _latestPosition = position;
    if (!_sourceInstalled) {
      await _installSourceAndLayer(map);
    }
    if (!_sourceInstalled) {
      return;
    }
    final collection = QalaGoMapUserLocationGeoJson.featureCollection(position);
    try {
      await _sink(map).setGeoJsonSource(
        QalaGoMapUserLocationLayerIds.source,
        collection,
      );
      if (position == null) {
        mapViewportDbg('MAPDBG userLocationLayer cleared');
      } else {
        mapViewportDbg(
          'MAPDBG userLocationLayer updated lat=${position.latitude} lng=${position.longitude}',
        );
      }
    } on PlatformException catch (e) {
      if (kDebugMode) {
        debugPrint('[QalaGoUserLocationLayer] setGeoJsonSource: ${e.code}');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[QalaGoUserLocationLayer] setGeoJsonSource: $e');
      }
    }
  }

  Future<void> _installSourceAndLayer(MapLibreMapController map) async {
    if (_sourceInstalled && _layerInstalled) {
      return;
    }
    final sink = _sink(map);
    if (!_sourceInstalled) {
      try {
        await sink.addSource(
          QalaGoMapUserLocationLayerIds.source,
          GeojsonSourceProperties(
            data: QalaGoMapUserLocationGeoJson.emptyFeatureCollection(),
            cluster: false,
          ),
        );
        _sourceInstalled = true;
      } on PlatformException catch (e) {
        if (kDebugMode) {
          debugPrint('[QalaGoUserLocationLayer] addSource: ${e.code}');
        }
        return;
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[QalaGoUserLocationLayer] addSource: $e');
        }
        return;
      }
    }

    if (!_layerInstalled) {
      try {
        await sink.addCircleLayer(
          QalaGoMapUserLocationLayerIds.source,
          QalaGoMapUserLocationLayerIds.circle,
          const CircleLayerProperties(
            circleRadius: QalaGoMapUserLocationLayerStyle.circleRadius,
            circleColor: QalaGoMapUserLocationLayerStyle.circleColor,
            circleOpacity: QalaGoMapUserLocationLayerStyle.circleOpacity,
            circleStrokeWidth: QalaGoMapUserLocationLayerStyle.circleStrokeWidth,
            circleStrokeColor: QalaGoMapUserLocationLayerStyle.circleStrokeColor,
            circleStrokeOpacity: QalaGoMapUserLocationLayerStyle.circleStrokeOpacity,
          ),
        );
        _layerInstalled = true;
      } on PlatformException catch (e) {
        if (kDebugMode) {
          debugPrint('[QalaGoUserLocationLayer] addCircleLayer: ${e.code}');
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[QalaGoUserLocationLayer] addCircleLayer: $e');
        }
      }
    }
  }

  Future<void> _tearDown(MapLibreMapController map) async {
    final sink = _sink(map);
    try {
      await sink.removeLayer(QalaGoMapUserLocationLayerIds.circle);
    } catch (_) {}
    try {
      await sink.removeSource(QalaGoMapUserLocationLayerIds.source);
    } catch (_) {}
    _sourceInstalled = false;
    _layerInstalled = false;
  }
}
