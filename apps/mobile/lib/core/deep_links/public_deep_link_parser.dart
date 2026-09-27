import 'public_deep_link_locale.dart';
import 'public_deep_link_parse_result.dart';
import 'public_deep_link_target.dart';
import 'public_deep_link_validation.dart';

/// Parses canonical QalaGo public HTTPS URLs into typed targets (pure, no I/O).
PublicDeepLinkParseResult parsePublicDeepLink(Uri uri) {
  if (uri.scheme.toLowerCase() != 'https') {
    return const PublicDeepLinkUnsupported();
  }

  if (uri.hasAuthority && uri.host.isEmpty) {
    return const PublicDeepLinkInvalid();
  }

  if (!isExactPublicDeepLinkHost(uri.host)) {
    return const PublicDeepLinkUnsupported();
  }

  if (uri.hasPort && uri.port != 443) {
    return const PublicDeepLinkUnsupported();
  }

  if (uri.userInfo.isNotEmpty) {
    return const PublicDeepLinkInvalid();
  }

  if (queryContainsForbiddenNavigationKeys(uri)) {
    return const PublicDeepLinkInvalid();
  }

  final locale = PublicDeepLinkLocale.tryParsePathSegment(
    _firstPathSegment(uri.path),
  );
  if (locale == null) {
    return const PublicDeepLinkUnsupported();
  }

  final pathParse = _pathSegments(uri.path);
  if (pathParse == null) {
    return const PublicDeepLinkInvalid();
  }
  final segments = pathParse;
  if (segments.length < 2) {
    return const PublicDeepLinkInvalid();
  }

  final citySlug = segments[1];
  if (!isValidPublicCitySlug(citySlug)) {
    return const PublicDeepLinkInvalid();
  }

  final tail = segments.length > 2 ? segments.sublist(2) : const <String>[];

  return _parseTail(locale, citySlug, tail, uri);
}

/// Safe entry for untrusted string input.
PublicDeepLinkParseResult parsePublicDeepLinkString(String raw) {
  if (raw.trim().isEmpty) {
    return const PublicDeepLinkUnsupported();
  }
  try {
    return parsePublicDeepLink(Uri.parse(raw.trim()));
  } catch (_) {
    return const PublicDeepLinkInvalid();
  }
}

PublicDeepLinkParseResult _parseTail(
  PublicDeepLinkLocale locale,
  String citySlug,
  List<String> tail,
  Uri uri,
) {
  if (tail.isEmpty) {
    if (!_noQueryParams(uri)) return const PublicDeepLinkInvalid();
    return PublicDeepLinkParsed(
      PublicDeepLinkCityHomeTarget(locale: locale, citySlug: citySlug),
    );
  }

  if (tail.length == 1) {
    final segment = tail[0];
    if (segment == 'categories') {
      if (!_noQueryParams(uri)) return const PublicDeepLinkInvalid();
      return PublicDeepLinkParsed(
        PublicDeepLinkCategoriesTarget(locale: locale, citySlug: citySlug),
      );
    }
    if (segment == 'search') {
      return _parseSearch(locale, citySlug, uri);
    }
    if (_cityReservedSegment(segment)) {
      return const PublicDeepLinkInvalid();
    }
    if (!isValidPublicCategorySlug(segment)) {
      return const PublicDeepLinkInvalid();
    }
    if (!_noQueryParams(uri)) return const PublicDeepLinkInvalid();
    return PublicDeepLinkParsed(
      PublicDeepLinkCategoryTarget(
        locale: locale,
        citySlug: citySlug,
        categorySlug: segment,
      ),
    );
  }

  if (tail.length == 2 && tail[0] == 'business') {
    final businessSlug = tail[1];
    if (!isValidPublicBusinessSlug(businessSlug)) {
      return const PublicDeepLinkInvalid();
    }
    if (!_allowedBusinessQueryOnly(uri)) {
      return const PublicDeepLinkInvalid();
    }
    final locationId = _parseBusinessLocationId(uri);
    if (locationId == null && uri.queryParameters.containsKey('locationId')) {
      return const PublicDeepLinkInvalid();
    }
    return PublicDeepLinkParsed(
      PublicDeepLinkBusinessTarget(
        locale: locale,
        citySlug: citySlug,
        businessSlug: businessSlug,
        locationId: locationId,
      ),
    );
  }

  if (tail.length == 2) {
    final categorySlug = tail[0];
    final subcategorySlug = tail[1];
    if (_cityReservedSegment(categorySlug)) {
      return const PublicDeepLinkInvalid();
    }
    if (!isValidPublicCategorySlug(categorySlug) ||
        !isValidPublicCategorySlug(subcategorySlug)) {
      return const PublicDeepLinkInvalid();
    }
    if (!_noQueryParams(uri)) return const PublicDeepLinkInvalid();
    return PublicDeepLinkParsed(
      PublicDeepLinkSubcategoryTarget(
        locale: locale,
        citySlug: citySlug,
        categorySlug: categorySlug,
        subcategorySlug: subcategorySlug,
      ),
    );
  }

  return const PublicDeepLinkInvalid();
}

PublicDeepLinkParseResult _parseSearch(
  PublicDeepLinkLocale locale,
  String citySlug,
  Uri uri,
) {
  if (!_allowedSearchQueryOnly(uri)) {
    return const PublicDeepLinkInvalid();
  }
  final q = normalizeSearchQuery(uri.queryParameters['q']);
  if (uri.queryParameters.containsKey('q') && q == null) {
    return const PublicDeepLinkInvalid();
  }
  return PublicDeepLinkParsed(
    PublicDeepLinkSearchTarget(
      locale: locale,
      citySlug: citySlug,
      query: q,
    ),
  );
}

bool _noQueryParams(Uri uri) => uri.queryParameters.isEmpty;

bool _allowedBusinessQueryOnly(Uri uri) {
  for (final key in uri.queryParameters.keys) {
    if (key.toLowerCase() == 'locationid') continue;
    return false;
  }
  return true;
}

bool _allowedSearchQueryOnly(Uri uri) {
  for (final key in uri.queryParameters.keys) {
    if (key.toLowerCase() == 'q') continue;
    return false;
  }
  return true;
}

String? _parseBusinessLocationId(Uri uri) {
  if (!uri.queryParameters.containsKey('locationId')) return null;
  final raw = uri.queryParameters['locationId'];
  if (raw == null || !isValidPublicLocationId(raw)) return null;
  return raw.trim();
}

bool _cityReservedSegment(String segment) {
  return {
    'categories',
    'search',
    'business',
    'promotions',
    'privacy',
    'terms',
    'support',
    'account-deletion',
  }.contains(segment.toLowerCase());
}

String? _firstPathSegment(String path) {
  final segments = _pathSegments(path);
  if (segments == null || segments.isEmpty) return null;
  return segments[0];
}

List<String>? _pathSegments(String path) {
  if (path.isEmpty || path == '/') return const [];
  final out = <String>[];
  for (final raw in path.split('/')) {
    if (raw.isEmpty) continue;
    try {
      out.add(Uri.decodeComponent(raw));
    } catch (_) {
      return null;
    }
  }
  return out;
}
