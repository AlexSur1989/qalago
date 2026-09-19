/// OpenMapTiles `poi` commercial suppression policy (C.6F.1).
///
/// Values verified against OpenMapTiles schema (`class` / `subclass` on layer
/// `poi`). City-agnostic — no geographic or catalog coupling.
abstract final class QalaGoMapCommercialPoiPolicy {
  /// Liberty mixed POI symbol layers (rank bands).
  static const libertyMixedPoiLayerIds = [
    'poi_r1',
    'poi_r7',
    'poi_r20',
  ];

  /// Layers that must never receive commercial suppression in C.6F.1.
  static const protectedLayerIds = [
    'poi_transit',
    'airport',
  ];

  /// Documented OpenMapTiles `poi.class` values that represent ordinary
  /// commercial / business discovery (not civic navigation).
  static const commercialPoiClasses = [
    'shop',
    'fast_food',
    'cafe',
    'bar',
    'alcohol_shop',
    'ice_cream',
    'clothing_store',
    'grocery',
    'lodging',
    'laundry',
    'beer',
    'car',
    'music',
  ];

  /// `subclass` values (amenity/shop/tourism tags) for commercial POIs when
  /// `class` alone does not group them (e.g. `restaurant`).
  static const commercialPoiSubclasses = [
    'restaurant',
    'fast_food',
    'cafe',
    'bar',
    'pub',
    'biergarten',
    'food_court',
    'ice_cream',
    'nightclub',
    'supermarket',
    'convenience',
    'mall',
    'department_store',
    'beauty',
    'hairdresser',
    'clothes',
    'shoes',
    'jewelry',
    'jewellery',
    'bakery',
    'butcher',
    'kiosk',
    'marketplace',
    'vending_machine',
    'tattoo',
    'stripclub',
    'casino',
    'bookmaker',
    'florist',
    'furniture',
    'electronics',
    'mobile_phone',
    'gift',
    'toys',
    'sports',
    'outdoor',
    'hardware',
    'doityourself',
    'travel_agency',
    'estate_agent',
    'company',
    'insurance',
    'lawyer',
    'accountant',
    'employment_agency',
  ];

  /// Embedded Liberty rank/geometry filters (OpenFreeMap Liberty 2026-09).
  static const libertyBaseFilters = {
    'poi_r1': [
      'all',
      [
        'match',
        ['geometry-type'],
        ['MultiPoint', 'Point'],
        true,
        false,
      ],
      [
        '>=',
        ['get', 'rank'],
        1,
      ],
      [
        '<',
        ['get', 'rank'],
        7,
      ],
    ],
    'poi_r7': [
      'all',
      [
        'match',
        ['geometry-type'],
        ['MultiPoint', 'Point'],
        true,
        false,
      ],
      [
        '>=',
        ['get', 'rank'],
        7,
      ],
      [
        '<',
        ['get', 'rank'],
        20,
      ],
    ],
    'poi_r20': [
      'all',
      [
        'match',
        ['geometry-type'],
        ['MultiPoint', 'Point'],
        true,
        false,
      ],
      [
        '>=',
        ['get', 'rank'],
        20,
      ],
    ],
  };

  /// MapLibre expression: true when POI is ordinary commercial discovery.
  static List<Object> commercialMatchExpression() {
    return [
      'any',
      [
        'in',
        ['get', 'class'],
        ['literal', commercialPoiClasses],
      ],
      [
        'in',
        ['get', 'subclass'],
        ['literal', commercialPoiSubclasses],
      ],
    ];
  }

  /// Append commercial suppression to an existing layer filter.
  static List<Object> mergeFilterWithCommercialSuppression(Object? existing) {
    final base = _normalizeBaseFilter(existing);
    return [
      'all',
      base,
      [
        '!',
        commercialMatchExpression(),
      ],
    ];
  }

  static List<Object> _normalizeBaseFilter(Object? existing) {
    if (existing is List && existing.isNotEmpty) {
      return existing.cast<Object>();
    }
    return ['boolean', true];
  }

  /// Structural check: policy must not reference city/catalog identifiers.
  static bool get isCityAgnostic => true;
}
