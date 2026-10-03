import '../../shared/models/business_branch_location.dart';

const ownerLocationLastDeleteBlockedCode = 'BUSINESS_LOCATION_LAST_DELETE_BLOCKED';
const ownerLocationPrimaryDeleteBlockedCode =
    'BUSINESS_LOCATION_PRIMARY_DELETE_BLOCKED';

Map<String, String> parseOwnerLocationWorkHours(dynamic raw) {
  if (raw is! Map) return {};
  return raw.map((key, value) => MapEntry(key.toString(), value.toString()));
}

Map<String, String> buildOwnerLocationWorkHours({
  required String weekdays,
  required String saturday,
  required String sunday,
}) {
  return {
    'mon': weekdays,
    'tue': weekdays,
    'wed': weekdays,
    'thu': weekdays,
    'fri': weekdays,
    'sat': saturday,
    'sun': sunday,
  };
}

({String weekdays, String saturday, String sunday}) ownerLocationHoursFromRaw(
  Map<String, String>? hours,
) {
  if (hours == null || hours.isEmpty) {
    const fallback = '09:00-22:00';
    return (weekdays: fallback, saturday: fallback, sunday: fallback);
  }
  final weekdays = hours['mon'] ?? hours['tue'] ?? '09:00-22:00';
  return (
    weekdays: weekdays,
    saturday: hours['sat'] ?? weekdays,
    sunday: hours['sun'] ?? weekdays,
  );
}

String summarizeOwnerLocationWorkHours(Map<String, dynamic>? raw, {String closedLabel = ''}) {
  final parsed = parseOwnerLocationWorkHours(raw);
  if (parsed.isEmpty) return '';
  final h = ownerLocationHoursFromRaw(parsed);
  if (h.weekdays == h.saturday && h.weekdays == h.sunday) {
    return h.weekdays;
  }
  return '${h.weekdays} · ${h.saturday} · ${h.sunday}';
}

Map<String, dynamic> buildCreateOwnerBusinessLocationPayload({
  required String cityId,
  required String address,
  double? latitude,
  double? longitude,
  String? locationSource,
  Map<String, String>? workHours,
  String? phone,
  String? whatsapp,
  String? instagram,
  String? website,
}) {
  final body = <String, dynamic>{
    'cityId': cityId,
    'address': address.trim(),
  };
  if (latitude != null && longitude != null) {
    body['latitude'] = latitude;
    body['longitude'] = longitude;
    if (locationSource != null && locationSource.isNotEmpty) {
      body['locationSource'] = locationSource;
    }
  }
  if (workHours != null) body['workHours'] = workHours;
  if (phone != null) body['phone'] = phone.isEmpty ? null : phone;
  if (whatsapp != null) body['whatsapp'] = whatsapp.isEmpty ? null : whatsapp;
  if (instagram != null) body['instagram'] = instagram.isEmpty ? null : instagram;
  if (website != null) body['website'] = website.isEmpty ? null : website;
  return body;
}

Map<String, dynamic> buildUpdateOwnerBusinessLocationPayload({
  required bool includeProfileFields,
  required bool includeHours,
  String? cityId,
  required String address,
  double? latitude,
  double? longitude,
  String? locationSource,
  Map<String, String>? workHours,
  String? phone,
  String? whatsapp,
  String? instagram,
  String? website,
}) {
  final patch = <String, dynamic>{};
  if (includeProfileFields) {
    if (cityId != null && cityId.isNotEmpty) patch['cityId'] = cityId;
    patch['address'] = address.trim();
    if (latitude != null && longitude != null) {
      patch['latitude'] = latitude;
      patch['longitude'] = longitude;
      patch['locationSource'] = locationSource ?? 'GEOCODED';
    }
    patch['phone'] = phone == null || phone.isEmpty ? null : phone;
    patch['whatsapp'] = whatsapp == null || whatsapp.isEmpty ? null : whatsapp;
    patch['instagram'] = instagram == null || instagram.isEmpty ? null : instagram;
    patch['website'] = website == null || website.isEmpty ? null : website;
  }
  if (includeHours && workHours != null) {
    patch['workHours'] = workHours;
  }
  return patch;
}

List<BusinessBranchLocation> enrichOwnerLocationsWithCities(
  List<BusinessBranchLocation> locations,
  List<Map<String, dynamic>> cities,
) {
  if (locations.isEmpty || cities.isEmpty) return locations;
  final byId = <String, Map<String, dynamic>>{
    for (final c in cities)
      if (c['id'] is String) c['id'] as String: c,
  };
  return locations.map((loc) {
    if (loc.citySlug.isNotEmpty && loc.cityNameRu.isNotEmpty) return loc;
    final city = byId[loc.cityId];
    if (city == null) return loc;
    return BusinessBranchLocation(
      id: loc.id,
      businessId: loc.businessId,
      cityId: loc.cityId,
      citySlug: city['slug'] as String? ?? loc.citySlug,
      cityNameRu: city['nameRu'] as String? ?? loc.cityNameRu,
      cityNameKk: city['nameKk'] as String? ?? loc.cityNameKk,
      address: loc.address,
      isPrimary: loc.isPrimary,
      latitude: loc.latitude,
      longitude: loc.longitude,
      workHours: loc.workHours,
      phone: loc.phone,
      whatsapp: loc.whatsapp,
      instagram: loc.instagram,
      website: loc.website,
    );
  }).toList(growable: false);
}

String? extractApiErrorCode(Object error) {
  final text = error.toString();
  for (final code in [
    ownerLocationLastDeleteBlockedCode,
    ownerLocationPrimaryDeleteBlockedCode,
  ]) {
    if (text.contains(code)) return code;
  }
  return null;
}
