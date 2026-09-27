/// Production public deep-link host (F.6 contract).
const kPublicDeepLinkHost = 'qalago.kz';

/// Max slug length aligned with practical catalog slugs (conservative).
const kPublicDeepLinkMaxSlugLength = 128;

const kPublicDeepLinkMaxQueryValueLength = 2048;

/// Reserved under `/{locale}/{citySlug}/…` — not category slugs (F.5).
const _cityReservedSegments = {
  'categories',
  'search',
  'business',
  'promotions',
  'privacy',
  'terms',
  'support',
  'account-deletion',
};

/// Query keys that must never influence navigation (F.6 / E contour).
const kPublicDeepLinkForbiddenQueryKeys = {
  'route',
  'url',
  'deeplink',
  'link',
  'redirect',
  'next',
  'callback',
};

bool isExactPublicDeepLinkHost(String host) {
  if (host.isEmpty) return false;
  return host.toLowerCase() == kPublicDeepLinkHost;
}

bool isValidPublicPathSegment(String segment) {
  if (segment.isEmpty || segment.length > kPublicDeepLinkMaxSlugLength) {
    return false;
  }
  if (segment.contains('/') ||
      segment.contains('\\') ||
      _containsControlChar(segment)) {
    return false;
  }
  return RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(segment);
}

bool isValidPublicCitySlug(String slug) => isValidPublicPathSegment(slug);

bool isValidPublicCategorySlug(String slug) {
  if (!isValidPublicPathSegment(slug)) return false;
  return !_cityReservedSegments.contains(slug.toLowerCase());
}

bool isValidPublicBusinessSlug(String slug) => isValidPublicPathSegment(slug);

/// Branch context id (cuid-style entity ids used in catalog).
bool isValidPublicLocationId(String raw) {
  final id = raw.trim();
  if (id.isEmpty || id.length > 64) return false;
  if (id.contains('/') ||
      id.contains('\\') ||
      id.contains(':') ||
      id.toLowerCase().startsWith('http')) {
    return false;
  }
  return RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(id);
}

bool queryContainsForbiddenNavigationKeys(Uri uri) {
  for (final key in uri.queryParameters.keys) {
    if (kPublicDeepLinkForbiddenQueryKeys.contains(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}

bool _containsControlChar(String value) {
  for (final unit in value.codeUnits) {
    if (unit < 0x20 || unit == 0x7f) return true;
  }
  return false;
}

String? normalizeSearchQuery(String? raw) {
  if (raw == null) return null;
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;
  if (trimmed.length > kPublicDeepLinkMaxQueryValueLength) return null;
  if (_containsControlChar(trimmed)) return null;
  return trimmed;
}
