import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/catalog/data/catalog_repository.dart';
import '../../shared/navigation/business_traffic_source.dart';
import '../../shared/navigation/open_business.dart';
import '../locale/app_locale_provider.dart';
import '../router/app_router.dart';
import 'deep_link_session_city.dart';
import 'public_deep_link_category_resolver.dart';
import 'public_deep_link_locale.dart';
import 'public_deep_link_target.dart';

/// Navigates validated [PublicDeepLinkTarget] instances via go_router.
class PublicDeepLinkExecutor {
  PublicDeepLinkExecutor(this.ref);

  final Ref ref;

  CatalogRepository get _catalog => ref.read(catalogRepositoryProvider);

  Future<bool> execute(PublicDeepLinkTarget target) async {
    _applyLocale(target.locale);
    final router = ref.read(appRouterProvider);

    return switch (target) {
      PublicDeepLinkCityHomeTarget(:final citySlug) => _openCityHome(router, citySlug),
      PublicDeepLinkCategoriesTarget(:final citySlug) =>
        _openCategories(router, citySlug),
      PublicDeepLinkCategoryTarget(:final citySlug, :final categorySlug) =>
        _openCategory(router, citySlug, categorySlug),
      PublicDeepLinkSubcategoryTarget(
        :final citySlug,
        :final categorySlug,
        :final subcategorySlug,
      ) =>
        _openSubcategory(router, citySlug, categorySlug, subcategorySlug),
      PublicDeepLinkBusinessTarget(
        :final citySlug,
        :final businessSlug,
        :final locationId,
      ) =>
        _openBusiness(router, citySlug, businessSlug, locationId),
      PublicDeepLinkSearchTarget(:final citySlug, :final query) =>
        _openSearch(router, citySlug, query),
    };
  }

  void _applyLocale(PublicDeepLinkLocale locale) {
    final code = locale.code;
    ref.read(appLocaleProvider.notifier).setLocale(Locale(code));
  }

  void _setSessionCity(String citySlug) {
    ref.read(deepLinkSessionCitySlugProvider.notifier).setSessionCitySlug(
          citySlug,
        );
  }

  bool _openCityHome(GoRouter router, String citySlug) {
    _setSessionCity(citySlug);
    router.go('/home');
    return true;
  }

  bool _openCategories(GoRouter router, String citySlug) {
    _setSessionCity(citySlug);
    router.push('/categories');
    return true;
  }

  Future<bool> _openCategory(
    GoRouter router,
    String citySlug,
    String categorySlug,
  ) async {
    _setSessionCity(citySlug);
    final resolved = await resolvePublicCategorySlugs(
      catalog: _catalog,
      citySlug: citySlug,
      categorySlug: categorySlug,
    );
    if (resolved == null) return false;
    router.push('/categories/${resolved.categoryId}');
    return true;
  }

  Future<bool> _openSubcategory(
    GoRouter router,
    String citySlug,
    String categorySlug,
    String subcategorySlug,
  ) async {
    _setSessionCity(citySlug);
    final resolved = await resolvePublicCategorySlugs(
      catalog: _catalog,
      citySlug: citySlug,
      categorySlug: categorySlug,
      subcategorySlug: subcategorySlug,
    );
    if (resolved == null || resolved.subcategoryId == null) return false;
    final params = <String, String>{
      'categoryId': resolved.categoryId,
      'subcategoryId': resolved.subcategoryId!,
    };
    router.push(Uri(path: '/search', queryParameters: params).toString());
    return true;
  }

  Future<bool> _openBusiness(
    GoRouter router,
    String citySlug,
    String businessSlug,
    String? locationId,
  ) async {
    _setSessionCity(citySlug);
    try {
      final detail = await _catalog.fetchBusinessBySlug(
        businessSlug: businessSlug,
        citySlug: citySlug,
        locationId: locationId,
      );
      final businessId = detail['id'];
      if (businessId is! String || businessId.trim().isEmpty) return false;
      final path = businessDetailRouteUri(
        businessId.trim(),
        BusinessTrafficSource.direct,
        selectedLocationId: locationId,
      ).toString();
      router.push(path);
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return false;
      if (e.response?.statusCode == 409) return false;
      return false;
    } catch (_) {
      return false;
    }
  }

  bool _openSearch(GoRouter router, String citySlug, String? query) {
    _setSessionCity(citySlug);
    final params = <String, String>{};
    if (query != null && query.isNotEmpty) {
      params['q'] = query;
    }
    final path = params.isEmpty
        ? '/search'
        : Uri(path: '/search', queryParameters: params).toString();
    router.push(path);
    return true;
  }
}

final publicDeepLinkExecutorProvider = Provider<PublicDeepLinkExecutor>(
  PublicDeepLinkExecutor.new,
);
