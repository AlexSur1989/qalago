import 'package:maplibre_gl/maplibre_gl.dart';

/// Flattens style-spec `paint` and `layout` from [getLayerProperties] snapshot.
Map<String, dynamic> qalagoFlattenLayerSnapshot(Map<String, dynamic> snapshot) {
  final flat = <String, dynamic>{};
  for (final section in ['paint', 'layout']) {
    final value = snapshot[section];
    if (value is Map) {
      flat.addAll(Map<String, dynamic>.from(value));
    }
  }
  return flat;
}

/// Merges [paintOverrides] onto existing layer paint/layout and builds
/// [LayerProperties] for [MapLibreMapController.setLayerProperties].
///
/// Public controller API always serializes with `skipNulls: false`, so every
/// field must be populated from the live style snapshot before applying edits.
LayerProperties qalagoLayerPropertiesWithPaintOverrides({
  required Map<String, dynamic> layerSnapshot,
  required Map<String, dynamic> paintOverrides,
}) {
  final type = layerSnapshot['type'] as String?;
  final flat = qalagoFlattenLayerSnapshot(layerSnapshot);
  flat.addAll(paintOverrides);
  return qalagoLayerPropertiesFromFlatStyle(type, flat);
}

LayerProperties qalagoLayerPropertiesWithPropertyOverrides({
  required Map<String, dynamic> layerSnapshot,
  required Map<String, dynamic> propertyOverrides,
}) {
  final type = layerSnapshot['type'] as String?;
  final flat = qalagoFlattenLayerSnapshot(layerSnapshot);
  flat.addAll(propertyOverrides);
  return qalagoLayerPropertiesFromFlatStyle(type, flat);
}

LayerProperties qalagoLayerPropertiesFromFlatStyle(
  String? type,
  Map<String, dynamic> flat,
) {
  switch (type) {
    case 'line':
      return LineLayerProperties.fromJson(flat);
    case 'fill':
      return FillLayerProperties.fromJson(flat);
    case 'fill-extrusion':
      return FillExtrusionLayerProperties.fromJson(flat);
    case 'symbol':
      return SymbolLayerProperties.fromJson(flat);
    case 'background':
      return BackgroundLayerProperties.fromJson(flat);
    case 'raster':
      return RasterLayerProperties.fromJson(flat);
    default:
      throw UnsupportedError('Unsupported layer type for QalaGo Light: $type');
  }
}
