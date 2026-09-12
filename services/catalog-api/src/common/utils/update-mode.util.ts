import { UpdateMode } from '@qalago/shared-types';
import { compareSemVer, parseSemVer } from './semver.util';

export type ClientVersionInput = {
  appVersion: string;
  buildNumber?: number | null;
  minimumVersion: string;
  latestVersion: string;
  minimumBuild?: number | null;
  latestBuild?: number | null;
};

export function resolveUpdateMode(input: ClientVersionInput): UpdateMode {
  parseSemVer(input.minimumVersion);
  parseSemVer(input.latestVersion);
  parseSemVer(input.appVersion);

  if (compareSemVer(input.appVersion, input.minimumVersion) < 0) {
    return UpdateMode.REQUIRED;
  }

  if (
    input.minimumBuild != null &&
    input.buildNumber != null &&
    input.buildNumber < input.minimumBuild
  ) {
    return UpdateMode.REQUIRED;
  }

  if (compareSemVer(input.appVersion, input.latestVersion) >= 0) {
    if (
      input.latestBuild != null &&
      input.buildNumber != null &&
      input.buildNumber >= input.latestBuild
    ) {
      return UpdateMode.NONE;
    }
    if (input.latestBuild == null || input.buildNumber == null) {
      return UpdateMode.NONE;
    }
  }

  if (compareSemVer(input.appVersion, input.latestVersion) < 0) {
    return UpdateMode.OPTIONAL;
  }

  if (
    input.latestBuild != null &&
    input.buildNumber != null &&
    input.buildNumber < input.latestBuild
  ) {
    return UpdateMode.OPTIONAL;
  }

  return UpdateMode.NONE;
}

export function assertReleaseVersionConfig(input: {
  minimumVersion: string;
  latestVersion: string;
  minimumBuild?: number | null;
  latestBuild?: number | null;
}): void {
  parseSemVer(input.minimumVersion);
  parseSemVer(input.latestVersion);
  if (compareSemVer(input.minimumVersion, input.latestVersion) > 0) {
    throw new Error('minimumVersion must not be greater than latestVersion');
  }
  if (input.minimumBuild != null && input.minimumBuild < 0) {
    throw new Error('minimumBuild must be non-negative');
  }
  if (input.latestBuild != null && input.latestBuild < 0) {
    throw new Error('latestBuild must be non-negative');
  }
  if (
    input.minimumBuild != null &&
    input.latestBuild != null &&
    input.minimumBuild > input.latestBuild
  ) {
    throw new Error('minimumBuild must not be greater than latestBuild');
  }
}
