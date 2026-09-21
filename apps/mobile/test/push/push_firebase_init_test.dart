import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/push/push_bootstrap.dart';
import 'package:qalago_mobile/core/push/push_registration_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('local mode without Firebase config does not crash on init', () async {
    await initializePushFirebase();
    expect(await PushRegistrationService.isFirebaseConfigured, isFalse);
  });
}
