/// Centralized API content locale resolution (Stage 6.10B.6).

String resolveLocaleCode(String code) {
  if (code.startsWith('kk')) return 'kk';
  return 'ru';
}

String? _normalizeOptional(String? value) {
  if (value == null) return null;
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}

/// QalaGo-owned taxonomy (city, category, subcategory).
String taxonomyDisplayName({
  required String localeCode,
  required String nameRu,
  String? nameKk,
  String? legacyTitle,
}) {
  final ru = nameRu.trim().isNotEmpty ? nameRu.trim() : (legacyTitle?.trim() ?? '');
  final kk = _normalizeOptional(nameKk);
  if (localeCode.startsWith('kk')) {
    return kk ?? ru;
  }
  return ru;
}

String cityDisplayName({
  required String localeCode,
  required String nameRu,
  String? nameKk,
}) {
  return taxonomyDisplayName(localeCode: localeCode, nameRu: nameRu, nameKk: nameKk);
}

/// Business-authored optional KK variant; [primary] remains canonical.
String businessAuthoredText({
  required String localeCode,
  required String primary,
  String? kk,
}) {
  final base = primary.trim();
  if (localeCode.startsWith('kk')) {
    final localized = _normalizeOptional(kk);
    if (localized != null) return localized;
  }
  return base;
}

String serviceItemTitle({
  required String localeCode,
  required String title,
  String? titleKk,
}) {
  return businessAuthoredText(localeCode: localeCode, primary: title, kk: titleKk);
}

String? serviceItemDescription({
  required String localeCode,
  String? description,
  String? descriptionKk,
}) {
  final primary = _normalizeOptional(description);
  if (localeCode.startsWith('kk')) {
    return _normalizeOptional(descriptionKk) ?? primary;
  }
  return primary;
}

String promotionTitle({
  required String localeCode,
  required String title,
  String? titleKk,
}) {
  return businessAuthoredText(localeCode: localeCode, primary: title, kk: titleKk);
}
