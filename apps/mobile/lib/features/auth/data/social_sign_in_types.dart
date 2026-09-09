/// Result of a native Google Sign-In attempt — no SDK types leak outward.
class GoogleSignInOutcome {
  const GoogleSignInOutcome._({
    this.idToken,
    this.cancelled = false,
    this.error,
  });

  const GoogleSignInOutcome.success(this.idToken)
      : cancelled = false,
        error = null;

  const GoogleSignInOutcome.cancelled()
      : idToken = null,
        cancelled = true,
        error = null;

  const GoogleSignInOutcome.noToken()
      : idToken = null,
        cancelled = false,
        error = null;

  const GoogleSignInOutcome.failure(this.error)
      : idToken = null,
        cancelled = false;

  final String? idToken;
  final bool cancelled;
  final Object? error;
}

/// Result of Sign in with Apple — identity token only, transient.
class AppleSignInOutcome {
  const AppleSignInOutcome._({
    this.identityToken,
    this.cancelled = false,
    this.error,
  });

  const AppleSignInOutcome.success(this.identityToken)
      : cancelled = false,
        error = null;

  const AppleSignInOutcome.cancelled()
      : identityToken = null,
        cancelled = true,
        error = null;

  const AppleSignInOutcome.noToken()
      : identityToken = null,
        cancelled = false,
        error = null;

  const AppleSignInOutcome.failure(this.error)
      : identityToken = null,
        cancelled = false;

  final String? identityToken;
  final bool cancelled;
  final Object? error;
}

abstract class GoogleSignInGateway {
  Future<GoogleSignInOutcome> signIn();
}

abstract class AppleSignInGateway {
  Future<AppleSignInOutcome> signIn();
}
