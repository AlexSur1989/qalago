import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import { hasBusinessCabinetAccess } from '@/lib/use-auth';
import { sanitizeInternalRedirect } from '@/lib/redirect-utils';

export type LoginDestination = {
  path: string;
  error?: string;
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
    return { path: '/login', error: 'Не удалось проверить доступ к заведениям' };
  }

  if (!hasBusinessCabinetAccess(user, items) && user.role !== 'USER') {
    return { path: '/login', error: 'Нет доступа к кабинету' };
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
