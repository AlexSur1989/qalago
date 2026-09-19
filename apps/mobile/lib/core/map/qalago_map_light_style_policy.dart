import 'package:maplibre_gl/maplibre_gl.dart';

/// Verified OpenFreeMap Liberty layer registry + QalaGo Light paint targets (C.6F.2).
///
/// Audited against `https://tiles.openfreemap.org/styles/liberty` (111 layers).
/// City-agnostic — no catalog or geographic coupling.
abstract final class QalaGoMapLightStylePolicy {
  static const openMapTilesSourceId = 'openmaptiles';

  /// Liberty style layer count at audit time (documentation / tests).
  static const auditedLibertyLayerCount = 111;

  static const backgroundColor = '#F7F9FB';
  static const waterFillColor = '#B8D4E8';
  static const waterLineColor = '#9FC5E0';
  static const parkFillColor = '#D4EDDA';
  static const landcoverWoodColor = '#D4EDDA';
  static const landcoverGrassColor = '#D4EDDA';
  static const buildingFillColor = '#E8ECF0';
  static const buildingExtrusionColor = '#E8ECF0';
  static const minorRoadColor = '#E2E6EC';
  static const roadCasingColor = '#D1D5DB';
  static const secondaryRoadColor = '#DDE1E7';
  static const primaryRoadColor = '#F5E6D3';
  static const motorwayRoadColor = '#F0C896';
  static const railLineColor = '#C4CBD4';
  static const boundaryColor = '#CBD5E1';

  /// Liberty street/road symbol layers — audited, never runtime-mutated in FIX 1.
  ///
  /// `maplibre_gl` [MapLibreMapController.setLayerProperties] sends null layout
  /// keys (`text-field`, `symbol-placement`, …) and clears working Liberty labels.
  static const libertyStreetRoadLabelLayerIds = [
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
    'highway-shield-non-us',
    'highway-shield-us-interstate',
    'road_shield_us',
  ];

  static const backgroundLayerIds = ['background'];

  static const naturalEarthLayerIds = ['natural_earth'];

  static const parkAndGreenFillLayerIds = [
    'park',
    'landcover_grass',
    'landcover_wood',
    'landuse_pitch',
    'landuse_track',
  ];

  static const waterFillLayerIds = ['water'];

  static const waterLineLayerIds = [
    'waterway_tunnel',
    'waterway_river',
    'waterway_other',
  ];

  static const buildingFillLayerIds = ['building'];

  static const buildingExtrusionLayerIds = ['building-3d'];

  static const minorRoadLayerIds = [
    'road_minor',
    'tunnel_minor',
    'bridge_street',
    'road_service_track',
    'tunnel_service_track',
    'bridge_service_track',
    'road_path_pedestrian',
    'tunnel_path_pedestrian',
    'bridge_path_pedestrian',
    'road_link',
    'tunnel_link',
    'bridge_link',
  ];

  static const secondaryRoadLayerIds = [
    'road_secondary_tertiary',
    'tunnel_secondary_tertiary',
    'bridge_secondary_tertiary',
  ];

  static const primaryRoadLayerIds = [
    'road_trunk_primary',
    'tunnel_trunk_primary',
    'bridge_trunk_primary',
  ];

  static const motorwayRoadLayerIds = [
    'road_motorway',
    'tunnel_motorway',
    'bridge_motorway',
    'road_motorway_link',
    'tunnel_motorway_link',
    'bridge_motorway_link',
  ];

  static const railLineLayerIds = [
    'road_major_rail',
    'road_major_rail_hatching',
    'road_transit_rail',
    'road_transit_rail_hatching',
    'tunnel_major_rail',
    'tunnel_major_rail_hatching',
    'tunnel_transit_rail',
    'tunnel_transit_rail_hatching',
    'bridge_major_rail',
    'bridge_major_rail_hatching',
    'bridge_transit_rail',
    'bridge_transit_rail_hatching',
  ];

  static const boundaryLineLayerIds = [
    'boundary_2',
    'boundary_3',
    'boundary_disputed',
  ];

  /// Symbol/navigation label layers preserved from Liberty (no runtime paint).
  static const preservedSymbolNavigationLayerIds = [
    ...libertyStreetRoadLabelLayerIds,
    'waterway_line_label',
    'water_name_point_label',
    'water_name_line_label',
    'poi_r1',
    'poi_r7',
    'poi_r20',
    'poi_transit',
    'airport',
    'label_city',
    'label_city_capital',
    'label_state',
    'label_country_1',
    'label_country_2',
    'label_country_3',
    'label_town',
    'label_village',
    'label_other',
  ];

  /// Paint mutation targets only (fills/lines/raster/background — no symbol layers).
  static List<String> get explicitTargetLayerIds => [
        ...backgroundLayerIds,
        ...naturalEarthLayerIds,
        ...parkAndGreenFillLayerIds,
        ...waterFillLayerIds,
        ...waterLineLayerIds,
        ...buildingFillLayerIds,
        ...buildingExtrusionLayerIds,
        ...minorRoadLayerIds,
        ...secondaryRoadLayerIds,
        ...primaryRoadLayerIds,
        ...motorwayRoadLayerIds,
        ...railLineLayerIds,
        ...boundaryLineLayerIds,
      ];

  static bool isTransportationCasingLayer(String layerId) {
    return layerId.endsWith('_casing') &&
        (layerId.startsWith('road_') ||
            layerId.startsWith('tunnel_') ||
            layerId.startsWith('bridge_'));
  }

  static LayerProperties? propertiesForLayer(String layerId) {
    if (backgroundLayerIds.contains(layerId)) {
      return BackgroundLayerProperties(backgroundColor: backgroundColor);
    }
    if (naturalEarthLayerIds.contains(layerId)) {
      return RasterLayerProperties(rasterOpacity: 0.35);
    }
    if (parkAndGreenFillLayerIds.contains(layerId)) {
      return FillLayerProperties(
        fillColor: parkFillColor,
        fillOpacity: 0.55,
      );
    }
    if (waterFillLayerIds.contains(layerId)) {
      return FillLayerProperties(fillColor: waterFillColor);
    }
    if (waterLineLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: waterLineColor);
    }
    if (buildingFillLayerIds.contains(layerId)) {
      return FillLayerProperties(
        fillColor: buildingFillColor,
        fillOutlineColor: '#DDE2E8',
      );
    }
    if (buildingExtrusionLayerIds.contains(layerId)) {
      return FillExtrusionLayerProperties(
        fillExtrusionColor: buildingExtrusionColor,
        fillExtrusionOpacity: 0.45,
      );
    }
    if (minorRoadLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: minorRoadColor);
    }
    if (secondaryRoadLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: secondaryRoadColor);
    }
    if (primaryRoadLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: primaryRoadColor);
    }
    if (motorwayRoadLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: motorwayRoadColor);
    }
    if (railLineLayerIds.contains(layerId)) {
      return LineLayerProperties(lineColor: railLineColor);
    }
    if (boundaryLineLayerIds.contains(layerId)) {
      return LineLayerProperties(
        lineColor: boundaryColor,
        lineOpacity: 0.55,
      );
    }
    if (preservedSymbolNavigationLayerIds.contains(layerId)) {
      return null;
    }
    if (isTransportationCasingLayer(layerId)) {
      return LineLayerProperties(lineColor: roadCasingColor);
    }
    return null;
  }

  static bool get isCityAgnostic => true;
}
