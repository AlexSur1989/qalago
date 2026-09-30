import type { BackofficeStatusPresentation } from '@qalago/brand/status';
import { ROLE_DEFINITIONS, UserRole } from './rbac';

const UNKNOWN_ROLE_LABEL = 'Неизвестная роль';

export function staffRoleLabel(role: string): string {
  if (role in ROLE_DEFINITIONS) {
    return ROLE_DEFINITIONS[role as UserRole].labelRu;
  }
  return UNKNOWN_ROLE_LABEL;
}

export function staffRolePresentation(role: string): BackofficeStatusPresentation {
  return { label: staffRoleLabel(role), tone: 'info' };
}

export function staffActivePresentation(isActive: boolean): BackofficeStatusPresentation {
  return isActive
    ? { label: 'Активен', tone: 'success' }
    : { label: 'Отключён', tone: 'danger' };
}
