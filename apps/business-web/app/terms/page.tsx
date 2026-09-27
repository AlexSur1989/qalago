import { permanentRedirect } from 'next/navigation';
import { consumerWebLegalUrl } from '@/lib/consumer-web-legal-redirect';

/** F.7 Phase 3 — legacy host; canonical legal content on Consumer Web. */
export default function LegacyTermsLegalRedirect() {
  permanentRedirect(consumerWebLegalUrl('/terms'));
}
