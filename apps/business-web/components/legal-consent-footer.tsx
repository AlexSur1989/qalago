import Link from 'next/link';

/** Login consent — Terms + Privacy acknowledgement (Stage 6.3). */
export function LegalConsentFooter() {
  return (
    <p className="legal-consent-footer">
      Продолжая, вы принимаете{' '}
      <Link href="/terms" target="_blank" rel="noopener noreferrer">
        Условия использования
      </Link>{' '}
      и подтверждаете, что ознакомились с{' '}
      <Link href="/privacy" target="_blank" rel="noopener noreferrer">
        Политикой конфиденциальности
      </Link>
      .
    </p>
  );
}
