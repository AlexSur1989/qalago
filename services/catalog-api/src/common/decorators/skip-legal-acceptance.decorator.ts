import { SetMetadata } from '@nestjs/common';

export const SKIP_LEGAL_ACCEPTANCE_KEY = 'skipLegalAcceptance';

/** Authenticated routes that must remain reachable before mandatory legal acceptance. */
export const SkipLegalAcceptance = () => SetMetadata(SKIP_LEGAL_ACCEPTANCE_KEY, true);
