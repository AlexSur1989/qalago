import 'public_deep_link_target.dart';

/// Outcome of parsing an untrusted public URL (no exceptions for control flow).
sealed class PublicDeepLinkParseResult {
  const PublicDeepLinkParseResult();
}

/// Canonical supported deep-link target.
final class PublicDeepLinkParsed extends PublicDeepLinkParseResult {
  const PublicDeepLinkParsed(this.target);

  final PublicDeepLinkTarget target;
}

/// Not a canonical F.6 URL (legacy neutral paths, wrong host, etc.).
final class PublicDeepLinkUnsupported extends PublicDeepLinkParseResult {
  const PublicDeepLinkUnsupported();
}

/// Recognized as QalaGo-shaped but failed validation (malformed slug, bad query, …).
final class PublicDeepLinkInvalid extends PublicDeepLinkParseResult {
  const PublicDeepLinkInvalid();
}
