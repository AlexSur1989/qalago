export type SemVerParts = {
  major: number;
  minor: number;
  patch: number;
};

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemVer(version: string): SemVerParts {
  const trimmed = version.trim();
  const match = SEMVER_RE.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareSemVer(a: string, b: string): number {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  return 0;
}

export function isSemVerLessThan(a: string, b: string): boolean {
  return compareSemVer(a, b) < 0;
}

export function isSemVerGreaterThan(a: string, b: string): boolean {
  return compareSemVer(a, b) > 0;
}

export function isSemVerLessOrEqual(a: string, b: string): boolean {
  return compareSemVer(a, b) <= 0;
}
