/// Consumer routes reachable without authentication (Stage 5A guest-first).
bool isPublicConsumerRoute(String location) {
  if (location == '/home') return true;
  if (location == '/categories') return true;
  if (location.startsWith('/categories/')) return true;
  if (location == '/map') return true;
  if (location == '/search') return true;
  if (location.startsWith('/business/')) return true;
  if (location == '/promotions') return true;
  if (location == '/profile') return true;
  if (location == '/profile/city') return true;
  if (location == '/profile/help') return true;
  if (location == '/profile/about') return true;
  if (location == '/favorites') return true;
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
