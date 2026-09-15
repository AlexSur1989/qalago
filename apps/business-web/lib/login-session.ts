import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import { hasBusinessCabinetAccess } from '@/lib/use-auth';
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
  let items: MyBusinessItem[] = [];
  try {
    const res = await ownerApi.listMyBusinesses(accessToken);
    items = res.items;
  } catch {
    return { path: '/login', errorKey: 'BUSINESSES_FETCH_FAILED' };
  }

  if (!hasBusinessCabinetAccess(user, items) && user.role !== 'USER') {
    return { path: '/login', errorKey: 'NO_CABINET_ACCESS' };
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
