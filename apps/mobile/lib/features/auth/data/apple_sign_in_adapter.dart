import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'social_sign_in_types.dart';

class AppleSignInAdapter implements AppleSignInGateway {
  AppleSignInAdapter({Future<bool> Function()? isAvailable})
      : _isAvailable = isAvailable ?? SignInWithApple.isAvailable;

  final Future<bool> Function() _isAvailable;

  @override
  Future<AppleSignInOutcome> signIn() async {
    try {
      if (!await _isAvailable()) {
        return AppleSignInOutcome.failure(
          StateError('Sign in with Apple unavailable on this device'),
        );
      }

      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: const [
          AppleIDAuthorizationScopes.email,
        ],
      );

      final token = credential.identityToken;
      if (token == null || token.isEmpty) {
        return const AppleSignInOutcome.noToken();
      }

      return AppleSignInOutcome.success(token);
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        return const AppleSignInOutcome.cancelled();
      }
      return AppleSignInOutcome.failure(e);
    } catch (e) {
      return AppleSignInOutcome.failure(e);
    }
  }
}
