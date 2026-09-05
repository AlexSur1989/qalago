import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';

void main() {
  group('public consumer routes', () {
    test('allows home and discovery without auth', () {
      expect(isPublicConsumerRoute('/home'), isTrue);
      expect(isPublicConsumerRoute('/categories'), isTrue);
      expect(isPublicConsumerRoute('/categories/abc'), isTrue);
      expect(isPublicConsumerRoute('/map'), isTrue);
      expect(isPublicConsumerRoute('/search'), isTrue);
      expect(isPublicConsumerRoute('/business/b1'), isTrue);
      expect(isPublicConsumerRoute('/promotions'), isTrue);
      expect(isPublicConsumerRoute('/profile'), isTrue);
      expect(isPublicConsumerRoute('/favorites'), isTrue);
    });

    test('blocks owner and admin routes for guests via auth-only check', () {
      expect(isOwnerRoute('/owner'), isTrue);
      expect(isOwnerRoute('/owner/promote'), isTrue);
      expect(isAdminRoute('/admin'), isTrue);
      expect(isAuthOnlyConsumerRoute('/notifications'), isTrue);
      expect(isAuthOnlyConsumerRoute('/profile/edit'), isTrue);
    });
  });
}
