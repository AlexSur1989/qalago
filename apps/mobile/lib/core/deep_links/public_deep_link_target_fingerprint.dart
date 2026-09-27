import 'public_deep_link_target.dart';

String publicDeepLinkTargetFingerprint(PublicDeepLinkTarget target) {
  return switch (target) {
    PublicDeepLinkCityHomeTarget(:final locale, :final citySlug) =>
      'city:${locale.code}:$citySlug',
    PublicDeepLinkCategoriesTarget(:final locale, :final citySlug) =>
      'categories:${locale.code}:$citySlug',
    PublicDeepLinkCategoryTarget(
      :final locale,
      :final citySlug,
      :final categorySlug,
    ) =>
      'category:${locale.code}:$citySlug:$categorySlug',
    PublicDeepLinkSubcategoryTarget(
      :final locale,
      :final citySlug,
      :final categorySlug,
      :final subcategorySlug,
    ) =>
      'sub:${locale.code}:$citySlug:$categorySlug:$subcategorySlug',
    PublicDeepLinkBusinessTarget(
      :final locale,
      :final citySlug,
      :final businessSlug,
      :final locationId,
    ) =>
      'business:${locale.code}:$citySlug:$businessSlug:${locationId ?? ''}',
    PublicDeepLinkSearchTarget(
      :final locale,
      :final citySlug,
      :final query,
    ) =>
      'search:${locale.code}:$citySlug:${query ?? ''}',
  };
}
