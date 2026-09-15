'use client';

import { useUi } from '@/components/locale-provider';
import Link from 'next/link';

/** Login consent — Terms + Privacy acknowledgement (Stage 6.3). */
export function LegalConsentFooter() {
  const ui = useUi();
  return (
    <p className="legal-consent-footer">
      Продолжая, вы принимаете{' '}
      <Link href="/terms" target="_blank" rel="noopener noreferrer">
        {ui.legalTermsLink}
      </Link>{' '}
      и подтверждаете, что ознакомились с{' '}
      <Link href="/privacy" target="_blank" rel="noopener noreferrer">
        {ui.__b34c5f}
      </Link>
      .
    </p>
  );
}
