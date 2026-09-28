import { permanentRedirect } from 'next/navigation';
import { publicHelpPath } from '@/lib/legal-paths';

/** Store-compliance compat — canonical public support is /help only. */
export default function SupportCompatRedirectPage() {
  permanentRedirect(publicHelpPath());
}
