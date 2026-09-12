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
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final token = credential.identityToken;
      if (token == null || token.isEmpty) {
        return const AppleSignInOutcome.noToken();
      }

      final given = credential.givenName?.trim();
      final family = credential.familyName?.trim();
      final displayName = _composeAppleDisplayName(given, family);

      return AppleSignInOutcome.success(
        token,
        firstLoginDisplayName: displayName,
      );
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

String? _composeAppleDisplayName(String? given, String? family) {
  final parts = <String>[
    if (given != null && given.isNotEmpty) given,
    if (family != null && family.isNotEmpty) family,
  ];
  if (parts.isEmpty) return null;
  return parts.join(' ');
}
