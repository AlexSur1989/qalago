'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import { legalConsentMiddle, legalConsentPrefix } from '@/lib/owner-visual-copy';
import Link from 'next/link';

/** Login consent — Terms + Privacy acknowledgement (Stage 6.3). */
export function LegalConsentFooter() {
  const ui = useUi();
  const locale = useLocale();
  return (
    <p className="legal-consent-footer">
      {legalConsentPrefix(locale)}{' '}
      <Link href="/terms" target="_blank" rel="noopener noreferrer">
        {ui.legalTermsLink}
      </Link>{' '}
      {legalConsentMiddle(locale)}{' '}
      <Link href="/privacy" target="_blank" rel="noopener noreferrer">
        {ui.__b34c5f}
      </Link>
      .
    </p>
  );
}
