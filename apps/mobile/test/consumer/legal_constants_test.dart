import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/legal_constants.dart'; // pubspec name: qalago_mobile

void main() {
  test('default legal URLs use qalago.kz', () {
    expect(LegalConstants.privacyUrl, 'https://qalago.kz/privacy');
    expect(LegalConstants.termsUrl, 'https://qalago.kz/terms');
    expect(
      LegalConstants.accountDeletionUrl,
      'https://qalago.kz/account-deletion',
    );
  });
}
