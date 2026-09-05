import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';

void main() {
  test('business detail route is public for guests', () {
    expect(isPublicConsumerRoute('/business/b1'), isTrue);
    expect(isPublicConsumerRoute('/business/unknown-id'), isTrue);
  });
}
