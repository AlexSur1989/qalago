import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/rbac/business_access.dart';
import '../../../core/rbac/role_permissions.dart';
import '../../../core/network/dio_provider.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/storage/auth_storage.dart';
import '../../../shared/models/models.dart';
import '../../ads/providers/ad_serve_provider.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../recommendations/data/ai_repository.dart';
import '../../business_onboarding/providers/onboarding_providers.dart';
import '../data/apple_sign_in_adapter.dart';
import '../data/google_sign_in_adapter.dart';
import '../data/social_sign_in_types.dart';
import '../../../shared/utils/auth_utils.dart';

final googleSignInGatewayProvider = Provider<GoogleSignInGateway>(
  (ref) => GoogleSignInAdapter(),
);

final appleSignInGatewayProvider = Provider<AppleSignInGateway>(
  (ref) => AppleSignInAdapter(),
);

final authRepositoryProvider = Provider(
  (ref) => AuthRepository(ref.watch(dioProvider)),
);

final catalogRepositoryProvider = Provider(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

final aiRepositoryProvider = Provider(
  (ref) => AiRepository(ref.watch(aiDioProvider)),
);

final favoritesRepositoryProvider = Provider(
  (ref) => FavoritesRepository(ref.watch(dioProvider)),
);

final adminRepositoryProvider = Provider(
  (ref) => AdminRepository(ref.watch(dioProvider)),
);

final notificationsRepositoryProvider = Provider(
  (ref) => NotificationsRepository(ref.watch(dioProvider)),
);

void invalidateUserScopedProviders(Ref ref) {
  ref.invalidate(favoritesProvider);
  ref.invalidate(myReviewsProvider);
  ref.invalidate(myBusinessEntriesProvider);
  ref.invalidate(notificationsProvider);
  ref.invalidate(unreadNotificationsProvider);
  ref.invalidate(businessFavoriteProvider);
  ref.invalidate(adminPendingBusinessesProvider);
  invalidateOnboardingProviders(ref);
}

/// Clears user-private caches when auth session ends or a new user logs in.
/// Must run from a separate provider — invalidating from [AuthNotifier] causes
/// Riverpod circular dependency errors.
final userScopedCacheCleanupProvider = Provider<void>((ref) {
  ref.listen<AuthState>(authProvider, (previous, next) {
    final wasAuthed = previous?.isAuthenticated ?? false;
    final isAuthed = next.isAuthenticated;
    if (wasAuthed == isAuthed) return;
    invalidateUserScopedProviders(ref);
  });
});

void invalidateCityScopedProviders(Ref ref) {
  ref.invalidate(cityCatalogTotalProvider);
  ref.invalidate(categoriesProvider);
  ref.invalidate(businessesProvider);
  ref.invalidate(mapBusinessesProvider);
  ref.invalidate(featuredBusinessesProvider);
  ref.invalidate(recommendedBusinessesProvider);
  ref.invalidate(promotionsProvider);
  ref.invalidate(adminPendingBusinessesProvider);
  ref.invalidate(serveAdsProvider);
}

/// Сбрасывает city-scoped провайдеры при смене slug в [cityProvider].
final cityChangeInvalidatorProvider = Provider<void>((ref) {
  ref.listen(cityProvider, (previous, next) {
    if (previous != null && previous.slug == next.slug) return;
    invalidateCityScopedProviders(ref);
  });
});

/// Clears auth on global 401 from API (expired/invalid JWT).
final authSessionGuardProvider = Provider<void>((ref) {
  ref.listen<int>(sessionExpiredProvider, (previous, next) {
    if (previous == null || next == previous) return;
    ref.read(authProvider.notifier).handleUnauthorized();
  });
});

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
  });

  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
  }) =>
      AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      );
}

class AuthNotifier extends Notifier<AuthState> {
  bool _socialLoginInProgress = false;

  @override
  AuthState build() {
    Future.microtask(init);
    return const AuthState(isLoading: true);
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);
  AuthStorage get _storage => ref.read(authStorageProvider);

  Future<void> init() async {
    final token = await _storage.readToken();
    if (token == null) {
      state = const AuthState(isLoading: false);
      return;
    }
    try {
      final user = await _repo.getMe();
      await _applyPreferredCityFromServer(user);
      state = AuthState(user: user, isAuthenticated: true);
    } catch (_) {
      await _storage.clear();
      state = const AuthState(isLoading: false);
    }
  }

  Future<void> _applyPreferredCityFromServer(UserModel user) async {
    if (user.role == 'CITY_ADMIN') {
      final slug = user.managedCitySlug;
      if (slug != null && slug.isNotEmpty) {
        await ref.read(cityProvider.notifier).selectCity(
              slug,
              user.managedCityName ?? slug,
            );
      }
      return;
    }

    final slug = user.preferredCitySlug;
    if (slug == null || slug.isEmpty) return;
    try {
      final cities = await ref.read(citiesProvider.future);
      final match = cities.firstWhere(
        (c) => c['slug'] == slug,
        orElse: () => {
          'slug': slug,
          'nameRu': user.preferredCityName ?? slug,
        },
      );
      await ref.read(cityProvider.notifier).selectCityFromApi(match);
    } catch (_) {
      await ref.read(cityProvider.notifier).selectCity(
            slug,
            user.preferredCityName ?? slug,
          );
    }
  }

  Future<void> _syncSessionCityToProfile(UserModel user) async {
    if (user.role == 'CITY_ADMIN') {
      await _applyPreferredCityFromServer(user);
      return;
    }

    final sessionCity = ref.read(cityProvider);
    try {
      final cities = await ref.read(citiesProvider.future);
      Map<String, dynamic>? match;
      for (final city in cities) {
        if (city['slug'] == sessionCity.slug) {
          match = city;
          break;
        }
      }
      if (match == null) return;
      final cityId = match['id'] as String?;
      if (cityId == null || cityId.isEmpty) return;

      final updated = await _repo.updateMe(preferredCityId: cityId);
      state = state.copyWith(
        user: updated.copyWith(
          preferredCitySlug: sessionCity.slug,
          preferredCityName: sessionCity.nameRu,
        ),
      );
    } catch (_) {
      // Session city stays local even if sync fails.
    }
  }

  /// Clears authenticated session. User-scoped providers react via [authProvider] watch.
  void clearSession() {
    state = const AuthState(isLoading: false);
  }

  Future<void> refreshUser() async {
    final user = await _repo.getMe();
    state = state.copyWith(user: user);
    await _applyPreferredCityFromServer(user);
  }

  Future<void> updateName(String name) async {
    final updated = await _repo.updateMe(name: name.trim());
    final current = state.user;
    state = state.copyWith(
      user: current?.copyWith(name: updated.name ?? name.trim()) ??
          updated.copyWith(name: name.trim()),
    );
  }

  Future<void> setPreferredCity({
    required String cityId,
    required String slug,
    required String nameRu,
    double? centerLat,
    double? centerLng,
  }) async {
    final user = await _repo.updateMe(preferredCityId: cityId);
    await ref.read(cityProvider.notifier).selectCity(
          slug,
          nameRu,
          centerLat: centerLat,
          centerLng: centerLng,
        );
    state = state.copyWith(
      user: user.copyWith(
        preferredCityId: cityId,
        preferredCitySlug: slug,
        preferredCityName: nameRu,
      ),
    );
  }

  Future<String?> sendCode(String phone) async {
    state = state.copyWith(isLoading: true);
    try {
      final result = await _repo.sendCode(phone);
      state = state.copyWith(isLoading: false);
      return result['debugCode'] as String?;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> verifyCode(
    String phone,
    String code, {
    String accountType = 'user',
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final result = await _repo.verifyCode(
        phone: phone,
        code: code,
        accountType: accountType,
      );
      await _finishLogin(result.token, result.user, refreshToken: result.refreshToken);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> devLogin(String phone) async {
    state = state.copyWith(isLoading: true);
    try {
      final result = await _repo.devLogin(phone);
      await _finishLogin(result.token, result.user, refreshToken: result.refreshToken);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    if (_socialLoginInProgress) return;
    _socialLoginInProgress = true;
    state = state.copyWith(isLoading: true);
    try {
      final outcome = await ref.read(googleSignInGatewayProvider).signIn();
      if (outcome.cancelled) {
        state = state.copyWith(isLoading: false);
        throw const SocialSignInCancelled();
      }
      final idToken = outcome.idToken;
      if (idToken == null || idToken.isEmpty) {
        state = state.copyWith(isLoading: false);
        throw const SocialSignInNoToken();
      }
      final result = await _repo.signInWithGoogle(idToken);
      await _finishLogin(result.token, result.user, refreshToken: result.refreshToken);
    } catch (e) {
      if (state.isAuthenticated) return;
      state = state.copyWith(isLoading: false);
      rethrow;
    } finally {
      _socialLoginInProgress = false;
    }
  }

  Future<void> signInWithApple() async {
    if (_socialLoginInProgress) return;
    _socialLoginInProgress = true;
    state = state.copyWith(isLoading: true);
    try {
      final outcome = await ref.read(appleSignInGatewayProvider).signIn();
      if (outcome.cancelled) {
        state = state.copyWith(isLoading: false);
        throw const SocialSignInCancelled();
      }
      final identityToken = outcome.identityToken;
      if (identityToken == null || identityToken.isEmpty) {
        state = state.copyWith(isLoading: false);
        throw const SocialSignInNoToken();
      }
      final result = await _repo.signInWithApple(identityToken);
      await _finishLogin(result.token, result.user, refreshToken: result.refreshToken);
    } catch (e) {
      if (state.isAuthenticated) return;
      state = state.copyWith(isLoading: false);
      rethrow;
    } finally {
      _socialLoginInProgress = false;
    }
  }

  Future<void> _finishLogin(
    String token,
    UserModel user, {
    String? refreshToken,
  }) async {
    await _storage.saveToken(token);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _storage.saveRefreshToken(refreshToken);
    }
    state = AuthState(user: user, isAuthenticated: true);
    await _syncSessionCityToProfile(user);
  }

  Future<void> logout() async {
    final refresh = await _storage.readRefreshToken();
    try {
      await _repo.logoutSession(refresh);
    } catch (_) {
      // Best-effort server revocation.
    }
    await _storage.clear();
    clearSession();
  }

  Future<void> deleteAccount() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repo.deleteAccount();
      await logout();
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> handleUnauthorized() async {
    await _storage.clear();
    clearSession();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final city = ref.watch(cityProvider);
  return ref.watch(catalogRepositoryProvider).fetchCategories(citySlug: city.slug);
});

class BusinessesQuery {
  const BusinessesQuery({
    this.search,
    this.categoryId,
    this.latitude,
    this.longitude,
    this.radiusKm,
  });

  final String? search;
  final String? categoryId;
  final double? latitude;
  final double? longitude;
  final double? radiusKm;

  @override
  bool operator ==(Object other) =>
      other is BusinessesQuery &&
      other.search == search &&
      other.categoryId == categoryId &&
      other.latitude == latitude &&
      other.longitude == longitude &&
      other.radiusKm == radiusKm;

  @override
  int get hashCode =>
      Object.hash(search, categoryId, latitude, longitude, radiusKm);
}

final businessesProvider = FutureProvider.family<PaginatedBusinesses, BusinessesQuery>(
  (ref, query) async {
    final city = ref.watch(cityProvider);
    return ref.watch(catalogRepositoryProvider).fetchBusinesses(
          citySlug: city.slug,
          search: query.search,
          categoryId: query.categoryId,
          latitude: query.latitude,
          longitude: query.longitude,
          radiusKm: query.radiusKm,
        );
  },
);

/// City-wide businesses for map markers (no geo radius filter). Limit 100 per MVP.
final mapBusinessesProvider = FutureProvider<PaginatedBusinesses>((ref) async {
  final city = ref.watch(cityProvider);
  return ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
        limit: 100,
      );
});

final featuredBusinessesProvider = FutureProvider((ref) async {
  final city = ref.watch(cityProvider);
  return ref.watch(catalogRepositoryProvider).fetchBusinesses(
        citySlug: city.slug,
      );
});

final recommendedBusinessesProvider = FutureProvider<List<RecommendedBusiness>>((ref) async {
  final city = ref.watch(cityProvider);
  final catalog = ref.watch(catalogRepositoryProvider);
  final ai = ref.watch(aiRepositoryProvider);

  try {
    final items = await ai.fetchRecommendations(citySlug: city.slug, limit: 10);
    if (items.isEmpty) {
      throw StateError('empty recommendations');
    }

    final businesses = await Future.wait<RecommendedBusiness>(
      items.map((item) async {
        final details = await catalog.fetchBusinessDetails(item.businessId);
        return RecommendedBusiness(
          business: BusinessModel.fromJson(details),
          reason: item.reason,
        );
      }),
    );
    return businesses;
  } catch (_) {
    final organic = await catalog.fetchBusinesses(
      citySlug: city.slug,
      limit: 10,
    );
    return organic.items
        .map(
          (business) => RecommendedBusiness(
            business: business,
            reason: business.categoryTitle ?? 'QalaGo',
          ),
        )
        .toList();
  }
});

final businessDetailsProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  return ref.watch(catalogRepositoryProvider).fetchBusinessDetails(id);
});

final serviceItemsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, businessId) async {
    return ref.watch(catalogRepositoryProvider).fetchServiceItems(businessId);
  },
);

final serviceMenuProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, businessId) async {
    return ref.watch(catalogRepositoryProvider).fetchServiceMenu(businessId);
  },
);

final favoritesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return [];
  return ref.watch(favoritesRepositoryProvider).fetchFavorites();
});

final businessFavoriteProvider = FutureProvider.family<bool, String>((ref, businessId) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return false;
  return ref.watch(favoritesRepositoryProvider).isFavorite(businessId);
});

final promotionsProvider = FutureProvider((ref) async {
  final city = ref.watch(cityProvider);
  return ref.watch(catalogRepositoryProvider).fetchPromotions(citySlug: city.slug);
});

final reviewsProvider = FutureProvider.family<List<ReviewModel>, String>((ref, businessId) async {
  return ref.watch(catalogRepositoryProvider).fetchReviews(businessId);
});

final myReviewsProvider = FutureProvider<List<ReviewModel>>((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return [];
  return ref.watch(catalogRepositoryProvider).fetchMyReviews();
});

final myBusinessEntriesProvider = FutureProvider<List<MyBusinessEntry>>((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return [];
  return ref.watch(catalogRepositoryProvider).fetchMyBusinesses();
});

/// Flat business maps for backward-compatible consumers.
final myBusinessesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final entries = await ref.watch(myBusinessEntriesProvider.future);
  return entries.map((entry) => entry.business).toList();
});

final hasBusinessCabinetAccessProvider = Provider<bool>((ref) {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return false;
  if (canManageBusinessCabinet(auth.user?.role)) return true;
  final entries = ref.watch(myBusinessEntriesProvider).valueOrNull ?? const [];
  return entries.isNotEmpty;
});

final adminModerationCitySlugProvider = Provider<String>((ref) {
  final user = ref.watch(authProvider).user;
  if (user?.role == 'CITY_ADMIN' && user!.managedCitySlug != null) {
    return user.managedCitySlug!;
  }
  return ref.watch(cityProvider).slug;
});

final adminModerationCityNameProvider = Provider<String>((ref) {
  final user = ref.watch(authProvider).user;
  if (user?.role == 'CITY_ADMIN' && user!.managedCityName != null) {
    return user.managedCityName!;
  }
  return ref.watch(cityProvider).nameRu;
});

final adminPendingBusinessesProvider = FutureProvider((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return [];
  final citySlug = ref.watch(adminModerationCitySlugProvider);
  return ref.watch(adminRepositoryProvider).fetchBusinesses(
        status: 'PENDING',
        citySlug: citySlug,
      );
});

final notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return [];
  return ref.watch(notificationsRepositoryProvider).fetchAll();
});

final unreadNotificationsProvider = FutureProvider<int>((ref) async {
  if (!ref.watch(authProvider).isAuthenticated) return 0;
  return ref.watch(notificationsRepositoryProvider).unreadCount();
});

final businessGalleryProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, businessId) async {
    return ref.watch(catalogRepositoryProvider).fetchBusinessImages(businessId);
  },
);

typedef BusinessAnalyticsQuery = ({String businessId, int days});

final businessAnalyticsDashboardProvider =
    FutureProvider.family<Map<String, dynamic>, BusinessAnalyticsQuery>(
  (ref, query) async {
    return ref.watch(catalogRepositoryProvider).fetchAnalyticsDashboard(
          query.businessId,
          days: query.days,
        );
  },
);

final businessAnalyticsProvider =
    FutureProvider.family<Map<String, dynamic>, BusinessAnalyticsQuery>(
  (ref, query) async {
    return ref.watch(catalogRepositoryProvider).fetchAnalyticsSummary(
          query.businessId,
          days: query.days,
        );
  },
);
