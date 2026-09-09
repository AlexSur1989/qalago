import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import { hasBusinessCabinetAccess } from '@/lib/use-auth';

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

  if (redirectParam) {
    return { path: redirectParam };
  }

  if (hasBusinessCabinetAccess(user, items)) {
    return { path: '/dashboard' };
  }

  return { path: '/onboarding' };
}
