import 'public_deep_link_locale.dart';

/// Typed internal target from a canonical QalaGo public HTTPS URL (F.6).
///
/// Phase 2 resolves slugs to ids and navigates; Phase 1 parsing only.
sealed class PublicDeepLinkTarget {
  const PublicDeepLinkTarget({
    required this.locale,
    required this.citySlug,
  });

  final PublicDeepLinkLocale locale;
  final String citySlug;
}

/// `/{locale}/{citySlug}`
final class PublicDeepLinkCityHomeTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkCityHomeTarget({
    required super.locale,
    required super.citySlug,
  });
}

/// `/{locale}/{citySlug}/categories`
final class PublicDeepLinkCategoriesTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkCategoriesTarget({
    required super.locale,
    required super.citySlug,
  });
}

/// `/{locale}/{citySlug}/{categorySlug}`
final class PublicDeepLinkCategoryTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkCategoryTarget({
    required super.locale,
    required super.citySlug,
    required this.categorySlug,
  });

  final String categorySlug;
}

/// `/{locale}/{citySlug}/{categorySlug}/{subcategorySlug}`
final class PublicDeepLinkSubcategoryTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkSubcategoryTarget({
    required super.locale,
    required super.citySlug,
    required this.categorySlug,
    required this.subcategorySlug,
  });

  final String categorySlug;
  final String subcategorySlug;
}

/// `/{locale}/{citySlug}/business/{businessSlug}` (+ optional `locationId`).
///
/// Phase 2: `GET /businesses/by-slug/:businessSlug?citySlug=&locationId=`.
final class PublicDeepLinkBusinessTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkBusinessTarget({
    required super.locale,
    required super.citySlug,
    required this.businessSlug,
    this.locationId,
  });

  final String businessSlug;
  final String? locationId;
}

/// `/{locale}/{citySlug}/search` (+ optional `q`).
final class PublicDeepLinkSearchTarget extends PublicDeepLinkTarget {
  const PublicDeepLinkSearchTarget({
    required super.locale,
    required super.citySlug,
    this.query,
  });

  final String? query;
}
