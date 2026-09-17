/// Current OSM raster tile configuration (Stage 6.11C.1 — flutter_map).
abstract final class OsmRasterMapConfig {
  static const tileUrlTemplate =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const userAgentPackageName = 'kz.qalago.mobile';
  static const attributionLabel = 'OpenStreetMap contributors';
}
