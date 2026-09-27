/// Supported public URL locale segments (F.5 / F.6).
enum PublicDeepLinkLocale {
  ru('ru'),
  kk('kk');

  const PublicDeepLinkLocale(this.code);
  final String code;

  /// Canonical path segments must be exactly `ru` or `kk` (F.5 URL authority).
  static PublicDeepLinkLocale? tryParsePathSegment(String? raw) {
    if (raw == null) return null;
    final segment = raw.trim();
    for (final locale in PublicDeepLinkLocale.values) {
      if (locale.code == segment) return locale;
    }
    return null;
  }
}
