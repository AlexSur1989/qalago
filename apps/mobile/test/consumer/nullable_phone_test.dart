import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('UserModel nullable phone', () {
    test('parses user without phone', () {
      final user = UserModel.fromJson({
        'id': 'u1',
        'role': 'USER',
        'name': 'Social User',
      });
      expect(user.phone, isNull);
      expect(user.id, 'u1');
    });

    test('parses user with phone unchanged', () {
      final user = UserModel.fromJson({
        'id': 'u2',
        'phone': '+77001234567',
        'role': 'USER',
      });
      expect(user.phone, '+77001234567');
    });

    test('parses optional email', () {
      final user = UserModel.fromJson({
        'id': 'u3',
        'email': 'user@example.com',
        'role': 'USER',
      });
      expect(user.email, 'user@example.com');
    });
  });
}
