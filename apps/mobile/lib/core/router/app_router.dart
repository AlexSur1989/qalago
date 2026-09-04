import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/businesses/presentation/business_details_screen.dart';
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
import '../../features/admin/presentation/admin_businesses_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../theme/app_theme.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
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
      final isLoggingIn = state.matchedLocation == '/login';
      final isAuthed = authState.isAuthenticated;
      if (!isAuthed && !isLoggingIn) return '/login';
      if (isAuthed && isLoggingIn) return '/home';
      if (state.matchedLocation.startsWith('/admin')) {
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
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (context, state) =>
                BusinessDetailsScreen(id: state.pathParameters['id']!),
          ),
        ],
      ),
      GoRoute(
        path: '/owner',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const OwnerDashboardScreen(),
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

  int _indexForLocation(String location) {
    if (location.startsWith('/categories')) return 1;
    if (location.startsWith('/map')) return 2;
    if (location.startsWith('/favorites')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);

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
        child: NavigationBar(
          selectedIndex: index,
          height: 76,
          elevation: 0,
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          indicatorColor: Colors.transparent,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          onDestinationSelected: (i) {
            switch (i) {
              case 0:
                context.go('/home');
              case 1:
                context.go('/categories');
              case 2:
                context.go('/map');
              case 3:
                context.go('/favorites');
              case 4:
                context.go('/profile');
            }
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: AppTheme.kzBlue),
              label: 'Главная',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view, color: AppTheme.kzBlue),
              label: 'Категории',
            ),
            NavigationDestination(
              icon: Icon(Icons.location_on_outlined),
              selectedIcon: Icon(Icons.location_on, color: AppTheme.kzBlue),
              label: 'Карта',
            ),
            NavigationDestination(
              icon: Icon(Icons.favorite_border),
              selectedIcon: Icon(Icons.favorite, color: AppTheme.kzBlue),
              label: 'Избранное',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person, color: AppTheme.kzBlue),
              label: 'Профиль',
            ),
          ],
        ),
      ),
    );
  }
}

