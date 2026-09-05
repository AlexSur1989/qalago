/// Consumer routes reachable without authentication (Stage 5A guest-first).
bool isPublicConsumerRoute(String location) {
  final path = Uri.parse(location).path;
  if (path == '/home') return true;
  if (path == '/categories') return true;
  if (path.startsWith('/categories/')) return true;
  if (path == '/map') return true;
  if (path == '/search') return true;
  if (path.startsWith('/business/')) return true;
  if (path == '/promotions') return true;
  if (path == '/profile') return true;
  if (path == '/profile/city') return true;
  if (path == '/profile/help') return true;
  if (path == '/profile/about') return true;
  if (path == '/favorites') return true;
  return false;
}

bool isAuthOnlyConsumerRoute(String location) {
  if (location == '/notifications') return true;
  if (location == '/profile/edit') return true;
  if (location == '/profile/reviews') return true;
  if (location == '/profile/permissions') return true;
  return false;
}

bool isOwnerRoute(String location) => location.startsWith('/owner');

bool isAdminRoute(String location) => location.startsWith('/admin');

String loginRedirectPath(String returnPath) {
  final encoded = Uri.encodeComponent(returnPath);
  return '/login?redirect=$encoded';
}
