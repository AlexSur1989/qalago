import 'package:flutter/material.dart';

import '../osm_raster_map_config.dart';
import '../qalago_map_renderer.dart';
import '../qalago_map_style_config.dart';

/// Bottom-left attribution for the active map renderer.
class QalaGoMapAttributionBar extends StatelessWidget {
  const QalaGoMapAttributionBar({
    super.key,
    required this.renderer,
  });

  final QalaGoMapRenderer renderer;

  @override
  Widget build(BuildContext context) {
    final labels = switch (renderer) {
      QalaGoMapRenderer.flutterMap => [OsmRasterMapConfig.attributionLabel],
      QalaGoMapRenderer.mapLibre => [
          QalaGoMapStyleConfig.mapLibreAttribution,
          QalaGoMapStyleConfig.openStreetMapAttribution,
        ],
    };

    return Material(
      color: Colors.white.withValues(alpha: 0.88),
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        child: Text(
          labels.join(' · '),
          style: const TextStyle(fontSize: 10, color: Colors.black87),
        ),
      ),
    );
  }
}
