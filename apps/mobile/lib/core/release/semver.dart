class SemVer {
  SemVer(this.major, this.minor, this.patch);

  final int major;
  final int minor;
  final int patch;

  static SemVer parse(String raw) {
    final parts = raw.trim().split('.');
    if (parts.length != 3) {
      throw FormatException('Invalid semver: $raw');
    }
    return SemVer(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
  }

  int compareTo(SemVer other) {
    if (major != other.major) return major.compareTo(other.major);
    if (minor != other.minor) return minor.compareTo(other.minor);
    return patch.compareTo(other.patch);
  }
}

enum ClientUpdateMode { none, optional, required }

ClientUpdateMode parseClientUpdateMode(String? raw) {
  switch (raw?.toUpperCase()) {
    case 'REQUIRED':
      return ClientUpdateMode.required;
    case 'OPTIONAL':
      return ClientUpdateMode.optional;
    default:
      return ClientUpdateMode.none;
  }
}
