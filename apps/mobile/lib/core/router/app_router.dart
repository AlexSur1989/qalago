import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/route_access.dart';
import '../rbac/business_access.dart';
import '../../shared/utils/auth_utils.dart';
import '../../shared/navigation/open_business.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/businesses/presentation/business_details_screen.dart';
import '../../features/businesses/presentation/business_catalog_screen.dart';
import '../../features/businesses/presentation/business_promotions_screen.dart';
import '../../features/businesses/presentation/business_photos_screen.dart';
import '../../features/categories/presentation/categories_screen.dart';
import '../../features/categories/presentation/category_businesses_screen.dart';
import '../locale/l10n_extension.dart';
import '../../features/favorites/presentation/favorites_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/map/map_discovery_scope.dart';
import '../../features/map/presentation/map_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/profile_edit_screen.dart';
import '../../features/profile/presentation/profile_city_screen.dart';
import '../../features/profile/presentation/profile_reviews_screen.dart';
import '../../features/reviews/presentation/business_reviews_screen.dart';
import '../../features/profile/presentation/profile_help_screen.dart';
import '../../features/profile/presentation/profile_about_screen.dart';
import '../../features/profile/presentation/profile_permissions_screen.dart';
import '../../features/profile/presentation/profile_language_screen.dart';
import '../../features/promotions/presentation/promotions_screen.dart';
import '../../core/rbac/role_permissions.dart';
import '../../features/owner/presentation/owner_dashboard_screen.dart';
import '../../features/business_onboarding/presentation/business_start_screen.dart';
import '../../features/business_onboarding/presentation/business_search_screen.dart';
import '../../features/business_onboarding/presentation/business_apply_screen.dart';
import '../../features/business_onboarding/presentation/business_applications_screen.dart';
import '../../features/business_onboarding/presentation/business_claim_screen.dart';
import '../../features/business_onboarding/presentation/business_claims_screen.dart';
import '../../features/owner/presentation/owner_menu_screen.dart';
import '../../features/owner/presentation/owner_gallery_screen.dart';
import '../../features/owner/presentation/owner_analytics_screen.dart';
import '../../features/owner/presentation/owner_edit_business_screen.dart';
import '../../features/owner/presentation/owner_promotions_screen.dart';
import '../../features/owner/presentation/owner_plan_screen.dart';
import '../../features/owner/presentation/owner_messages_screen.dart';
import '../../features/owner/presentation/owner_settings_screen.dart';
import '../../features/owner/presentation/owner_help_screen.dart';
import '../../features/admin/presentation/admin_businesses_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/owner/presentation/owner_reviews_screen.dart';
import '../../features/owner/presentation/owner_team_screen.dart';
import '../../features/owner/presentation/owner_invitation_screen.dart';
import '../../features/owner/monetization/presentation/promote_business_screen.dart';
import '../../features/owner/monetization/presentation/promote_product_screen.dart';
import '../../features/owner/monetization/presentation/promote_package_screen.dart';
import '../../features/owner/monetization/presentation/vip_creative_screen.dart';
import '../../features/owner/monetization/presentation/monetization_order_confirm_screen.dart';
import '../../features/owner/monetization/presentation/monetization_orders_screen.dart';
import '../../features/owner/monetization/presentation/monetization_campaigns_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../shared/widgets/qalago_bottom_navigation.dart';
import '../../shared/widgets/qalago_startup_surface.dart';
import '../../core/onboarding/onboarding_provider.dart';
import '../../features/onboarding/presentation/welcome_screen.dart';
import '../../features/onboarding/presentation/onboarding_city_screen.dart';
import '../../features/legal/presentation/legal_acceptance_screen.dart';
import '../../features/legal/providers/legal_provider.dart';
import 'consumer_shell_navigation.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Used by push tap handling to reach the app navigator without a BuildContext.
GlobalKey<NavigatorState> get qalagoRootNavigatorKey => _rootNavigatorKey;

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
    _ref.listen(myBusinessEntriesProvider, (_, __) => notifyListeners());
    _ref.listen(onboardingProvider, (_, __) => notifyListeners());
    _ref.listen(legalAcceptanceRequiredProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}

bool _isOnboardingRoute(String location) {
  return location == '/startup' ||
      location == '/welcome' ||
      location == '/onboarding/city';
}

String? _onboardingRedirect(Ref ref, String location) {
  final onboarding = ref.read(onboardingProvider);
  if (onboarding.isLoading) {
    return location == '/startup' ? null : '/startup';
  }
  if (onboarding.hasError) {
    return location == '/welcome' ? null : '/welcome';
  }
  final snapshot = onboarding.requireValue;
  if (snapshot.requiresOnboarding) {
    if (location == '/welcome' || location == '/onboarding/city') return null;
    return '/welcome';
  }
  if (_isOnboardingRoute(location)) {
    return '/home';
  }
  return null;
}

bool _hasBusinessCabinetAccess(Ref ref, AuthState authState) {
  if (!authState.isAuthenticated) return false;
  return canAccessBusinessCabinet(
    authState.user?.role,
    ref.read(myBusinessEntriesProvider).valueOrNull ?? const [],
  );
}

final _routerRefreshProvider = Provider<_RouterRefresh>((ref) {
  final refresh = _RouterRefresh(ref);
  ref.onDispose(refresh.dispose);
  return refresh;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(_routerRefreshProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/startup',
    refreshListenable: refresh,
    redirect: (context, state) {
      final location = state.matchedLocation;
      final onboardingRedirect = _onboardingRedirect(ref, location);
      if (onboardingRedirect != null) return onboardingRedirect;

      final authState = ref.read(authProvider);
      final isLoggingIn = location == '/login';
      final isAuthed = authState.isAuthenticated;

      if (!isAuthed) {
        if (isLoggingIn || isPublicConsumerRoute(location)) return null;
        if (isOwnerRoute(location) ||
            isAdminRoute(location) ||
            isBusinessOnboardingRoute(location) ||
            isAuthOnlyConsumerRoute(location)) {
          return loginRedirectPath(state.uri.toString());
        }
        return loginRedirectPath(state.uri.toString());
      }

      if (isAuthed && isLoggingIn) {
        return resolvePostLoginRoute(
          redirectQuery: state.uri.queryParameters['redirect'],
        );
      }

      final legalRequired = ref.read(legalAcceptanceRequiredProvider);
      final onLegalAccept = location.startsWith('/legal/accept');
      if (isAuthed && legalRequired && !onLegalAccept) {
        final redirect = Uri.encodeComponent(state.uri.toString());
        return '/legal/accept?redirect=$redirect';
      }
      if (isAuthed && !legalRequired && onLegalAccept) {
        return '/home';
      }

      if (isOwnerRoute(location)) {
        if (location == '/owner/create-business') return null;
        if (!_hasBusinessCabinetAccess(ref, authState)) {
          return '/profile';
        }
      }

      if (isAdminRoute(location)) {
        if (!canModerate(authState.user?.role)) return '/profile';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/startup',
        builder: (context, state) => const QalaGoStartupSurface(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/onboarding/city',
        builder: (context, state) => const OnboardingCityScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/legal/accept',
        builder: (context, state) => LegalAcceptanceScreen(
          redirectPath: state.uri.queryParameters['redirect'],
        ),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/categories',
            builder: (context, state) => const CategoriesScreen(),
          ),
          GoRoute(
            path: '/categories/:categoryId',
            builder: (context, state) => CategoryBusinessesScreen(
              categoryId: state.pathParameters['categoryId']!,
              categoryTitle:
                  state.uri.queryParameters['title'] ??
                  context.l10n.categoryFallbackTitle,
            ),
          ),
          GoRoute(path: '/map', builder: (context, state) => const MapScreen()),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/profile/edit',
            builder: (context, state) => const ProfileEditScreen(),
          ),
          GoRoute(
            path: '/profile/city',
            builder: (context, state) => const ProfileCityScreen(),
          ),
          GoRoute(
            path: '/profile/reviews',
            builder: (context, state) => const ProfileReviewsScreen(),
          ),
          GoRoute(
            path: '/profile/help',
            builder: (context, state) => const ProfileHelpScreen(),
          ),
          GoRoute(
            path: '/profile/about',
            builder: (context, state) => const ProfileAboutScreen(),
          ),
          GoRoute(
            path: '/profile/permissions',
            builder: (context, state) => const ProfilePermissionsScreen(),
          ),
          GoRoute(
            path: '/profile/language',
            builder: (context, state) => const ProfileLanguageScreen(),
          ),
          GoRoute(
            path: '/promotions',
            builder: (context, state) => const PromotionsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => SearchScreen(
              initialQuery: state.uri.queryParameters['q'],
              categoryId: state.uri.queryParameters['categoryId'],
              subcategoryId: state.uri.queryParameters['subcategoryId'],
              initialRadiusKm: state.uri.queryParameters['radiusKm'],
              initialSort: state.uri.queryParameters['sort'],
            ),
          ),
          GoRoute(
            path: '/business/apply',
            builder: (context, state) => BusinessApplyScreen(
              applicationId: state.uri.queryParameters['id'],
            ),
          ),
          GoRoute(
            path: '/business/search',
            builder: (context, state) => const BusinessSearchScreen(),
          ),
          GoRoute(
            path: '/business/start',
            builder: (context, state) => const BusinessStartScreen(),
          ),
          GoRoute(
            path: '/business/applications',
            builder: (context, state) => const BusinessApplicationsScreen(),
          ),
          GoRoute(
            path: '/business/claims',
            builder: (context, state) => const BusinessClaimsScreen(),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (context, state) {
              final businessId = state.pathParameters['id']!;
              final locationId = parseSelectedLocationIdFromRoute(
                state.uri.queryParameters['locationId'],
              );
              return BusinessDetailsScreen(
                key: ValueKey('$businessId|${locationId ?? ''}'),
                id: businessId,
                trafficSource: parseBusinessTrafficSourceFromRoute(
                  state.uri.queryParameters['source'],
                ),
                searchQuery: parseBusinessSearchQueryFromRoute(
                  state.uri.queryParameters['searchQuery'],
                ),
                selectedLocationId: locationId,
              );
            },
          ),
          GoRoute(
            path: '/business/:id/catalog',
            builder: (context, state) {
              final businessId = state.pathParameters['id']!;
              final locationId = parseSelectedLocationIdFromRoute(
                state.uri.queryParameters['locationId'],
              );
              return BusinessCatalogScreen(
                key: ValueKey('$businessId|${locationId ?? ''}'),
                businessId: businessId,
                locationId: locationId,
              );
            },
          ),
          GoRoute(
            path: '/business/:id/promotions',
            builder: (context, state) {
              final businessId = state.pathParameters['id']!;
              final locationId = parseSelectedLocationIdFromRoute(
                state.uri.queryParameters['locationId'],
              );
              return BusinessPromotionsScreen(
                key: ValueKey('$businessId|promotions|${locationId ?? ''}'),
                businessId: businessId,
                locationId: locationId,
              );
            },
          ),
          GoRoute(
            path: '/business/:id/photos',
            builder: (context, state) {
              final businessId = state.pathParameters['id']!;
              final locationId = parseSelectedLocationIdFromRoute(
                state.uri.queryParameters['locationId'],
              );
              return BusinessPhotosScreen(
                key: ValueKey('$businessId|${locationId ?? ''}'),
                businessId: businessId,
                locationId: locationId,
              );
            },
          ),
          GoRoute(
            path: '/business/:id/reviews',
            builder: (context, state) => BusinessReviewsScreen(
              businessId: state.pathParameters['id']!,
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/owner',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerDashboardScreen(),
      ),
      GoRoute(
        path: '/owner/plan',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerPlanScreen(),
      ),
      GoRoute(
        path: '/owner/team',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerTeamScreen(),
      ),
      GoRoute(
        path: '/invite/:token',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerInvitationScreen(
          token: state.pathParameters['token']!,
        ),
      ),
      GoRoute(
        path: '/owner/messages',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerMessagesScreen(),
      ),
      GoRoute(
        path: '/owner/settings',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerSettingsScreen(),
      ),
      GoRoute(
        path: '/owner/help',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerHelpScreen(),
      ),
      GoRoute(
        path: '/owner/create-business',
        parentNavigatorKey: _rootNavigatorKey,
        redirect: (_, __) => '/business/apply',
      ),
      GoRoute(
        path: '/business/start',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const BusinessStartScreen(),
      ),
      GoRoute(
        path: '/business/search',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const BusinessSearchScreen(),
      ),
      GoRoute(
        path: '/business/apply',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => BusinessApplyScreen(
          applicationId: state.uri.queryParameters['id'],
        ),
      ),
      GoRoute(
        path: '/business/applications',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const BusinessApplicationsScreen(),
      ),
      GoRoute(
        path: '/business/claims',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const BusinessClaimsScreen(),
      ),
      GoRoute(
        path: '/business/:id/claim',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => BusinessClaimScreen(
          businessId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/owner/edit/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerEditBusinessScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/menu/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerMenuScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/gallery/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerGalleryScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/analytics/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerAnalyticsScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/promotions/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerPromotionsScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/reviews/:businessId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => OwnerReviewsScreen(
          businessId: state.pathParameters['businessId']!,
          businessTitle: state.uri.queryParameters['title'] ?? 'Заведение',
        ),
      ),
      GoRoute(
        path: '/owner/promote',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PromoteBusinessScreen(),
      ),
      GoRoute(
        path: '/owner/promote/package/:packageCode',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => PromotePackageScreen(
          packageCode: state.pathParameters['packageCode']!,
        ),
      ),
      GoRoute(
        path: '/owner/promote/vip-creative',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => VipCreativeScreen(
          checkoutExtra: state.extra as Map<String, dynamic>? ?? {},
        ),
      ),
      GoRoute(
        path: '/owner/promote/:productCode',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => PromoteProductScreen(
          productCode: state.pathParameters['productCode']!,
        ),
      ),
      GoRoute(
        path: '/owner/monetization/confirm',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => MonetizationOrderConfirmScreen(
          extra: state.extra as Map<String, dynamic>? ?? {},
        ),
      ),
      GoRoute(
        path: '/owner/monetization/orders',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MonetizationOrdersScreen(),
      ),
      GoRoute(
        path: '/owner/monetization/orders/:orderId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => MonetizationOrderDetailScreen(
          orderId: state.pathParameters['orderId']!,
        ),
      ),
      GoRoute(
        path: '/owner/monetization/campaigns',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MonetizationCampaignsScreen(),
      ),
      GoRoute(
        path: '/owner/monetization/campaigns/:campaignId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => MonetizationCampaignDetailScreen(
          campaignId: state.pathParameters['campaignId']!,
        ),
      ),
      GoRoute(
        path: '/admin',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const AdminBusinessesScreen(),
      ),
    ],
  );
});

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final path = GoRouterState.of(context).uri.path;
    final showBar = ConsumerShellNavigation.showBottomBar(path);
    final selectedTab = ConsumerShellNavigation.selectedTabIndex(path);

    void clearMapScope() {
      ref.read(mapDiscoveryScopeProvider.notifier).state = null;
    }

    final l10n = context.l10n;

    Widget? bottomBar;
    if (showBar && selectedTab != null) {
      bottomBar = QalaGoBottomNavigation(
        currentIndex: selectedTab,
        items: [
          QalaGoBottomNavItem(
            label: l10n.navHome,
            icon: Icons.home_outlined,
            selectedIcon: Icons.home,
            onTap: () {
              clearMapScope();
              context.go('/home');
            },
          ),
          QalaGoBottomNavItem(
            label: l10n.navCategories,
            icon: Icons.grid_view_outlined,
            selectedIcon: Icons.grid_view,
            onTap: () {
              clearMapScope();
              context.go('/categories');
            },
          ),
          QalaGoBottomNavItem(
            label: l10n.navMap,
            icon: Icons.location_on_outlined,
            selectedIcon: Icons.location_on,
            onTap: () {
              clearMapScope();
              context.go('/map');
            },
          ),
          QalaGoBottomNavItem(
            label: l10n.navFavorites,
            icon: Icons.favorite_border,
            selectedIcon: Icons.favorite,
            onTap: () {
              clearMapScope();
              context.go('/favorites');
            },
          ),
          QalaGoBottomNavItem(
            label: l10n.navProfile,
            icon: Icons.person_outline,
            selectedIcon: Icons.person,
            onTap: () {
              clearMapScope();
              context.go('/profile');
            },
          ),
        ],
      );
    }

    return Scaffold(
      body: child,
      resizeToAvoidBottomInset: true,
      bottomNavigationBar: bottomBar,
    );
  }
}
