/// Consumer search radius modes (Stage 5B).
enum SearchRadiusMode {
  wholeCity,
  km3,
  km5,
  km10,
  km15,
}

extension SearchRadiusModeX on SearchRadiusMode {
  String get label => switch (this) {
        SearchRadiusMode.wholeCity => 'Весь город',
        SearchRadiusMode.km3 => '3 км',
        SearchRadiusMode.km5 => '5 км',
        SearchRadiusMode.km10 => '10 км',
        SearchRadiusMode.km15 => '15 км',
      };

  /// `null` means city-wide query without geo radius.
  double? get radiusKm => switch (this) {
        SearchRadiusMode.wholeCity => null,
        SearchRadiusMode.km3 => 3,
        SearchRadiusMode.km5 => 5,
        SearchRadiusMode.km10 => 10,
        SearchRadiusMode.km15 => 15,
      };

  static SearchRadiusMode fromRadiusKmParam(String? value) {
    if (value == null || value.isEmpty) return SearchRadiusMode.wholeCity;
    final parsed = double.tryParse(value);
    return switch (parsed) {
      3 => SearchRadiusMode.km3,
      5 => SearchRadiusMode.km5,
      10 => SearchRadiusMode.km10,
      15 => SearchRadiusMode.km15,
      _ => SearchRadiusMode.wholeCity,
    };
  }

  String? get routeParam {
    final km = radiusKm;
    if (km == null) return null;
    return km == km.roundToDouble() ? '${km.toInt()}' : '$km';
  }
}

String buildSearchFilterSummary({
  required String cityName,
  String? categoryTitle,
  required SearchRadiusMode radiusMode,
  String? query,
}) {
  final parts = <String>[];
  if (categoryTitle != null && categoryTitle.isNotEmpty) {
    parts.add(categoryTitle);
  } else if (query != null && query.isNotEmpty) {
    parts.add('«$query»');
  }
  parts.add(radiusMode == SearchRadiusMode.wholeCity
      ? cityName
      : 'до ${radiusMode.label}');
  return parts.join(' · ');
}

Map<String, String> buildSearchRouteParams({
  String? query,
  String? categoryId,
  SearchRadiusMode radiusMode = SearchRadiusMode.wholeCity,
}) {
  final params = <String, String>{};
  final q = query?.trim();
  if (q != null && q.isNotEmpty) params['q'] = q;
  if (categoryId != null && categoryId.isNotEmpty) {
    params['categoryId'] = categoryId;
  }
  final radius = radiusMode.routeParam;
  if (radius != null) params['radiusKm'] = radius;
  return params;
}
