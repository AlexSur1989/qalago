import { AuthUser, MyBusinessItem, legalApi, ownerApi, userRequiresPlatformLegalAcceptance } from '@/lib/api';
import { hasBusinessCabinetAccess } from '@/lib/business-cabinet-access';
import { sanitizeInternalRedirect } from '@/lib/redirect-utils';
import type { PostLoginErrorKey } from '@/lib/presentation';

export type LoginDestination = {
  path: string;
  errorKey?: PostLoginErrorKey;
};

export async function resolvePostLoginDestination(
  accessToken: string,
  user: AuthUser,
  redirectParam: string | null,
): Promise<LoginDestination> {
  if (userRequiresPlatformLegalAcceptance(user.role)) {
    try {
      const legal = await legalApi.fetchCurrent(accessToken);
      if (legal.acceptanceRequired) {
        const safe = sanitizeInternalRedirect(redirectParam);
        const q = safe ? `?redirect=${encodeURIComponent(safe)}` : '';
        return { path: `/legal/accept${q}` };
      }
    } catch {
      return { path: '/login', errorKey: 'BUSINESSES_FETCH_FAILED' };
    }
  }

  let items: MyBusinessItem[] = [];
  try {
    const res = await ownerApi.listMyBusinesses(accessToken);
    items = res.items;
  } catch {
    return { path: '/login', errorKey: 'BUSINESSES_FETCH_FAILED' };
  }

  const safeRedirect = sanitizeInternalRedirect(redirectParam);
  if (safeRedirect) {
    return { path: safeRedirect };
  }

  if (hasBusinessCabinetAccess(user, items)) {
    return { path: '/dashboard' };
  }

  return { path: '/onboarding' };
}
