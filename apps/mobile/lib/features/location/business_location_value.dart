enum BusinessLocationSource { geocoded, manuallyAdjusted }

class BusinessLocationValue {
  const BusinessLocationValue({
    this.displayAddress = '',
    this.latitude,
    this.longitude,
    this.source = BusinessLocationSource.geocoded,
  });

  final String displayAddress;
  final double? latitude;
  final double? longitude;
  final BusinessLocationSource source;

  bool get hasValidCoordinates {
    if (latitude == null || longitude == null) return false;
    if (!latitude!.isFinite || !longitude!.isFinite) return false;
    if (latitude! < -90 || latitude! > 90) return false;
    if (longitude! < -180 || longitude! > 180) return false;
    if (latitude == 0 && longitude == 0) return false;
    return true;
  }

  BusinessLocationValue copyWith({
    String? displayAddress,
    double? latitude,
    double? longitude,
    BusinessLocationSource? source,
  }) {
    return BusinessLocationValue(
      displayAddress: displayAddress ?? this.displayAddress,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      source: source ?? this.source,
    );
  }

  Map<String, dynamic> toPayload() {
    if (!hasValidCoordinates) return {};
    return {
      'latitude': latitude,
      'longitude': longitude,
      'locationSource': source == BusinessLocationSource.manuallyAdjusted
          ? 'MANUALLY_ADJUSTED'
          : 'GEOCODED',
    };
  }

  static BusinessLocationValue? fromApplicationJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    final lat = _parseCoord(json['latitude']);
    final lng = _parseCoord(json['longitude']);
    final address = json['address'] as String? ?? '';
    if (lat == null || lng == null) {
      return BusinessLocationValue(displayAddress: address);
    }
    final sourceRaw = json['locationSource'] as String?;
    return BusinessLocationValue(
      displayAddress: address,
      latitude: lat,
      longitude: lng,
      source: sourceRaw == 'MANUALLY_ADJUSTED'
          ? BusinessLocationSource.manuallyAdjusted
          : BusinessLocationSource.geocoded,
    );
  }

  static BusinessLocationValue? fromBusinessJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    final lat = _parseCoord(json['latitude']);
    final lng = _parseCoord(json['longitude']);
    final address = json['address'] as String? ?? '';
    if (lat == null || lng == null) {
      return BusinessLocationValue(displayAddress: address);
    }
    final sourceRaw = json['locationSource'] as String?;
    return BusinessLocationValue(
      displayAddress: address,
      latitude: lat,
      longitude: lng,
      source: sourceRaw == 'MANUALLY_ADJUSTED'
          ? BusinessLocationSource.manuallyAdjusted
          : BusinessLocationSource.geocoded,
    );
  }

  static double? _parseCoord(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
}
