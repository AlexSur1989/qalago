/// Paint merge helpers for QalaGo Light (C.6F.2 FIX 2).
abstract final class QalaGoMapLightStylePaintMerge {
  static const lineWidthScaleMinor = 1.32;
  static const lineWidthScaleSecondary = 1.26;
  static const lineWidthScalePrimary = 1.22;
  static const lineWidthScaleMotorway = 1.18;
  static const lineWidthScaleCasing = 1.24;

  static Map<String, dynamic> paintFromLayerSnapshot(
    Map<String, dynamic>? layerSnapshot,
  ) {
    final paint = layerSnapshot?['paint'];
    if (paint is Map) {
      return Map<String, dynamic>.from(paint);
    }
    return {};
  }

  static dynamic scaleLineWidth(dynamic lineWidth, double factor) {
    if (lineWidth == null) {
      return null;
    }
    if (lineWidth is num) {
      return lineWidth * factor;
    }
    if (lineWidth is List) {
      return ['*', lineWidth, factor];
    }
    return lineWidth;
  }

  static Map<String, dynamic> mergeLinePaint({
    required Map<String, dynamic> basePaint,
    required String lineColor,
    required double widthScale,
  }) {
    final merged = Map<String, dynamic>.from(basePaint);
    merged['line-color'] = lineColor;
    final width = basePaint['line-width'];
    if (width != null) {
      merged['line-width'] = scaleLineWidth(width, widthScale);
    }
    return merged;
  }

  static Map<String, dynamic> mergeFillPaint({
    required Map<String, dynamic> basePaint,
    required String fillColor,
    String? fillOutlineColor,
  }) {
    final merged = Map<String, dynamic>.from(basePaint);
    merged['fill-color'] = fillColor;
    if (fillOutlineColor != null) {
      merged['fill-outline-color'] = fillOutlineColor;
    }
    return merged;
  }

  /// Safe symbol paint keys (never send layout keys like text-field).
  static const symbolPaintKeys = {
    'text-color',
    'text-halo-color',
    'text-halo-width',
    'text-halo-blur',
    'text-opacity',
    'icon-opacity',
    'icon-color',
  };

  static Map<String, dynamic> streetLabelPaintOverrides({
    String textColor = '#555D66',
    String haloColor = '#F7F9FB',
    double haloWidth = 1.15,
  }) {
    return {
      'text-color': textColor,
      'text-halo-color': haloColor,
      'text-halo-width': haloWidth,
    };
  }

  static Map<String, dynamic> majorStreetLabelPaintOverrides() {
    return streetLabelPaintOverrides(textColor: '#4B5563', haloWidth: 1.2);
  }
}
