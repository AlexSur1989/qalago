import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_light_style_paint_merge.dart';

/// Verified OpenFreeMap Liberty layer registry + QalaGo Light paint targets (C.6F.2).
abstract final class QalaGoMapLightStylePolicy {
  static const openMapTilesSourceId = 'openmaptiles';
  static const auditedLibertyLayerCount = 111;

  static const backgroundColor = '#F7F9FB';
  static const waterFillColor = '#B8D4E8';
  static const waterLineColor = '#9FC5E0';
  static const parkFillColor = '#D4EDDA';
  static const buildingFillColor = '#DDE3E8';
  static const buildingOutlineColor = '#D1D7DE';
  static const buildingExtrusionColor = '#DDE3E8';
  static const buildingExtrusionOpacity = 0.55;
  static const minorRoadColor = '#D4D8DE';
  static const roadCasingColor = '#C5CBD3';
  static const secondaryRoadColor = '#C8CDD6';
  static const primaryRoadColor = '#F0DCC4';
  static const motorwayRoadColor = '#E8B880';
  static const railLineColor = '#C4CBD4';
  static const boundaryColor = '#CBD5E1';

  static const libertyStreetRoadLabelLayerIds = [
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
    'highway-shield-non-us',
    'highway-shield-us-interstate',
    'road_shield_us',
  ];

  static const majorStreetLabelLayerIds = ['highway-name-major'];

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
        ...libertyStreetRoadLabelLayerIds,
      ];

  static bool isTransportationCasingLayer(String layerId) {
    return layerId.endsWith('_casing') &&
        (layerId.startsWith('road_') ||
            layerId.startsWith('tunnel_') ||
            layerId.startsWith('bridge_'));
  }

  static bool isStreetRoadLabelLayer(String layerId) {
    return libertyStreetRoadLabelLayerIds.contains(layerId);
  }

  static double lineWidthScaleFor(String layerId) {
    if (minorRoadLayerIds.contains(layerId)) {
      return QalaGoMapLightStylePaintMerge.lineWidthScaleMinor;
    }
    if (secondaryRoadLayerIds.contains(layerId)) {
      return QalaGoMapLightStylePaintMerge.lineWidthScaleSecondary;
    }
    if (primaryRoadLayerIds.contains(layerId)) {
      return QalaGoMapLightStylePaintMerge.lineWidthScalePrimary;
    }
    if (motorwayRoadLayerIds.contains(layerId)) {
      return QalaGoMapLightStylePaintMerge.lineWidthScaleMotorway;
    }
    if (isTransportationCasingLayer(layerId)) {
      return QalaGoMapLightStylePaintMerge.lineWidthScaleCasing;
    }
    return 1.0;
  }

  static String? lineColorFor(String layerId) {
    if (minorRoadLayerIds.contains(layerId)) {
      return minorRoadColor;
    }
    if (secondaryRoadLayerIds.contains(layerId)) {
      return secondaryRoadColor;
    }
    if (primaryRoadLayerIds.contains(layerId)) {
      return primaryRoadColor;
    }
    if (motorwayRoadLayerIds.contains(layerId)) {
      return motorwayRoadColor;
    }
    if (railLineLayerIds.contains(layerId)) {
      return railLineColor;
    }
    if (boundaryLineLayerIds.contains(layerId)) {
      return boundaryColor;
    }
    if (isTransportationCasingLayer(layerId)) {
      return roadCasingColor;
    }
    if (waterLineLayerIds.contains(layerId)) {
      return waterLineColor;
    }
    return null;
  }

  static Map<String, dynamic>? streetLabelPaintFor(String layerId) {
    if (!isStreetRoadLabelLayer(layerId)) {
      return null;
    }
    if (majorStreetLabelLayerIds.contains(layerId)) {
      return QalaGoMapLightStylePaintMerge.majorStreetLabelPaintOverrides();
    }
    return QalaGoMapLightStylePaintMerge.streetLabelPaintOverrides();
  }

  static LayerProperties? simplePropertiesForLayer(String layerId) {
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
    return null;
  }

  static bool get isCityAgnostic => true;

  /// Previous C.6F.2 building fill before FIX 2 legibility tuning.
  static const previousBuildingFillColor = '#E8ECF0';
}
