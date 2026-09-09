import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/constants/app_constants.dart';
import 'social_sign_in_types.dart';

class GoogleSignInAdapter implements GoogleSignInGateway {
  GoogleSignInAdapter({GoogleSignIn? googleSignIn})
      : _googleSignIn = googleSignIn ?? GoogleSignIn.instance;

  final GoogleSignIn _googleSignIn;
  Future<void>? _initFuture;

  Future<void> _ensureInitialized() {
    _initFuture ??= _googleSignIn.initialize(
      clientId: AppConstants.googleClientId.isEmpty
          ? null
          : AppConstants.googleClientId,
      serverClientId: AppConstants.googleServerClientId.isEmpty
          ? null
          : AppConstants.googleServerClientId,
    );
    return _initFuture!;
  }

  @override
  Future<GoogleSignInOutcome> signIn() async {
    try {
      await _ensureInitialized();
      final account = await _googleSignIn.authenticate();
      final idToken = account.authentication.idToken;
      if (idToken == null || idToken.isEmpty) {
        return const GoogleSignInOutcome.noToken();
      }
      return GoogleSignInOutcome.success(idToken);
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled ||
          e.code == GoogleSignInExceptionCode.interrupted ||
          e.code == GoogleSignInExceptionCode.uiUnavailable) {
        return const GoogleSignInOutcome.cancelled();
      }
      return GoogleSignInOutcome.failure(e);
    } catch (e) {
      return GoogleSignInOutcome.failure(e);
    }
  }
}
