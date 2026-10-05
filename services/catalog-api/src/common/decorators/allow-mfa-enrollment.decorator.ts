import { SetMetadata } from '@nestjs/common';

/** Narrow allowlist for authenticated requests before mandatory MFA enrollment. */
export const ALLOW_MFA_ENROLLMENT_KEY = 'allow_mfa_enrollment';
export const AllowMfaEnrollment = () => SetMetadata(ALLOW_MFA_ENROLLMENT_KEY, true);
