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
import '../../features/businesses/presentation/business_photos_screen.dart';
import '../../features/categories/presentation/categories_screen.dart';
import '../../features/categories/presentation/category_businesses_screen.dart';
import '../../features/favorites/presentation/favorites_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/map/presentation/map_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/profile_edit_screen.dart';
import '../../features/profile/presentation/profile_city_screen.dart';
import '../../features/profile/presentation/profile_reviews_screen.dart';
import '../../features/profile/presentation/profile_help_screen.dart';
import '../../features/profile/presentation/profile_about_screen.dart';
import '../../features/profile/presentation/profile_permissions_screen.dart';
import '../../features/promotions/presentation/promotions_screen.dart';
import '../../core/rbac/role_permissions.dart';
import '../../features/owner/presentation/owner_dashboard_screen.dart';
import '../../features/owner/presentation/create_business_screen.dart';
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
import '../../features/owner/monetization/presentation/promote_business_screen.dart';
import '../../features/owner/monetization/presentation/promote_product_screen.dart';
import '../../features/owner/monetization/presentation/promote_package_screen.dart';
import '../../features/owner/monetization/presentation/vip_creative_screen.dart';
import '../../features/owner/monetization/presentation/monetization_order_confirm_screen.dart';
import '../../features/owner/monetization/presentation/monetization_orders_screen.dart';
import '../../features/owner/monetization/presentation/monetization_campaigns_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../theme/app_theme.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
    _ref.listen(myBusinessEntriesProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
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
    initialLocation: '/home',
    refreshListenable: refresh,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final location = state.matchedLocation;
      final isLoggingIn = location == '/login';
      final isAuthed = authState.isAuthenticated;

      if (!isAuthed) {
        if (isLoggingIn || isPublicConsumerRoute(location)) return null;
        if (isOwnerRoute(location) || isAdminRoute(location) ||
            isAuthOnlyConsumerRoute(location)) {
          return loginRedirectPath(state.uri.toString());
        }
        return loginRedirectPath(state.uri.toString());
      }

      if (isAuthed && isLoggingIn) {
        final redirect = state.uri.queryParameters['redirect'];
        if (redirect != null && redirect.isNotEmpty) {
          return sanitizeLoginRedirect(redirect);
        }
        if (_hasBusinessCabinetAccess(ref, authState)) {
          return '/owner';
        }
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
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
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
              categoryTitle: state.uri.queryParameters['title'] ?? 'Категория',
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
              initialRadiusKm: state.uri.queryParameters['radiusKm'],
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (context, state) => BusinessDetailsScreen(
              id: state.pathParameters['id']!,
              trafficSource: parseBusinessTrafficSourceFromRoute(
                state.uri.queryParameters['source'],
              ),
              searchQuery: parseBusinessSearchQueryFromRoute(
                state.uri.queryParameters['searchQuery'],
              ),
            ),
          ),
          GoRoute(
            path: '/business/:id/catalog',
            builder: (context, state) => BusinessCatalogScreen(
              businessId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/business/:id/photos',
            builder: (context, state) => BusinessPhotosScreen(
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
        builder: (context, state) => const CreateBusinessScreen(),
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

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  int? _tabIndexForPath(String path) {
    if (path == '/home') return 0;
    if (path.startsWith('/categories')) return 1;
    if (path == '/map') return 2;
    if (path == '/favorites') return 3;
    if (path.startsWith('/profile')) return 4;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final selectedTab = _tabIndexForPath(path);

    return Scaffold(
      body: child,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 18,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 76,
            child: Row(
              children: [
                _ShellTab(
                  index: 0,
                  selectedIndex: selectedTab,
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: 'Главная',
                  onTap: () => context.go('/home'),
                ),
                _ShellTab(
                  index: 1,
                  selectedIndex: selectedTab,
                  icon: Icons.grid_view_outlined,
                  selectedIcon: Icons.grid_view,
                  label: 'Категории',
                  onTap: () => context.go('/categories'),
                ),
                _ShellTab(
                  index: 2,
                  selectedIndex: selectedTab,
                  icon: Icons.location_on_outlined,
                  selectedIcon: Icons.location_on,
                  label: 'Карта',
                  onTap: () => context.go('/map'),
                ),
                _ShellTab(
                  index: 3,
                  selectedIndex: selectedTab,
                  icon: Icons.favorite_border,
                  selectedIcon: Icons.favorite,
                  label: 'Избранное',
                  onTap: () => context.go('/favorites'),
                ),
                _ShellTab(
                  index: 4,
                  selectedIndex: selectedTab,
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                  label: 'Профиль',
                  onTap: () => context.go('/profile'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ShellTab extends StatelessWidget {
  const _ShellTab({
    required this.index,
    required this.selectedIndex,
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.onTap,
  });

  final int index;
  final int? selectedIndex;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isSelected = selectedIndex == index;
    final color = isSelected ? AppTheme.kzBlue : const Color(0xFF8A919F);

    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isSelected ? selectedIcon : icon, color: color, size: 26),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

