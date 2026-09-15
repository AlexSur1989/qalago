/// Consumer [AppShell] bottom navigation — visibility and tab selection policy.
abstract final class ConsumerShellNavigation {
  static const tabHome = 0;
  static const tabCategories = 1;
  static const tabMap = 2;
  static const tabFavorites = 3;
  static const tabProfile = 4;

  /// Tab index when the bottom bar is shown; `null` if [showBottomBar] is false.
  static int? selectedTabIndex(String path) {
    if (!showBottomBar(path)) return null;
    if (path == '/home') return tabHome;
    if (path == '/categories' || path.startsWith('/categories/')) {
      return tabCategories;
    }
    if (path == '/map') return tabMap;
    if (path == '/favorites') return tabFavorites;
    if (path == '/profile') return tabProfile;
    return null;
  }

  /// Bottom bar only on primary tab roots and tab-owned list routes (e.g. category businesses).
  static bool showBottomBar(String path) {
    if (path == '/home') return true;
    if (path == '/categories' || path.startsWith('/categories/')) return true;
    if (path == '/map') return true;
    if (path == '/favorites') return true;
    if (path == '/profile') return true;
    return false;
  }

  /// Routes that stay in the shell but hide the bottom bar (detail / task flows).
  static bool isShellOverlayRoute(String path) {
    if (path == '/search') return true;
    if (path.startsWith('/business/')) return true;
    if (path.startsWith('/profile/') && path != '/profile') return true;
    if (path == '/promotions') return true;
    if (path == '/notifications') return true;
    return false;
  }
}
