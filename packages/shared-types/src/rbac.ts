import { UserRole } from './index';

export interface RoleDefinition {
  role: UserRole;
  labelRu: string;
  summaryRu: string;
  can: string[];
  cannot: string[];
  apps: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  [UserRole.USER]: {
    role: UserRole.USER,
    labelRu: 'Житель',
    summaryRu: 'Обычный пользователь приложения.',
    apps: ['Mobile'],
    can: [
      'Смотреть каталог, карту и акции',
      'Добавлять заведения в избранное',
      'Оставлять отзывы',
      'Редактировать свой профиль и город',
      'Подать заявку на добавление заведения',
    ],
    cannot: [
      'Модерировать чужие заведения',
      'Редактировать чужие профили бизнеса',
      'Назначать VIP / Топ',
      'Управлять пользователями и ролями',
      'Вход в admin-web',
    ],
  },
  [UserRole.BUSINESS]: {
    role: UserRole.BUSINESS,
    labelRu: 'Владелец бизнеса',
    summaryRu: 'Владелец одного или нескольких заведений.',
    apps: ['Mobile', 'Business-web'],
    can: [
      'Всё, что доступно жителю',
      'Кабинет владельца: профиль, меню, галерея',
      'Акции и статистика своих заведений',
      'Ответы на отзывы клиентов',
    ],
    cannot: [
      'Модерировать чужие заявки',
      'Редактировать чужие заведения',
      'Менять VIP / статус публикации напрямую',
      'Управлять пользователями',
      'Вход в admin-web (только business-web)',
    ],
  },
  [UserRole.CITY_ADMIN]: {
    role: UserRole.CITY_ADMIN,
    labelRu: 'Модератор города',
    summaryRu: 'Администратор одного города (например, Актобе).',
    apps: ['Mobile', 'Admin-web'],
    can: [
      'Модерация заведений только своего города',
      'Одобрение / блокировка заявок в своём городе',
      'VIP / Топ в рамках своего города',
      'Черновики подборок для своего города (admin-web)',
      'Кабинет бизнеса (если есть свои заведения)',
    ],
    cannot: [
      'Модерировать другие города',
      'Менять роли пользователей',
      'Список всех пользователей платформы',
      'Переключать город в admin-web (город закреплён)',
    ],
  },
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    labelRu: 'Администратор платформы',
    summaryRu: 'Полный доступ к модерации и настройкам MVP.',
    apps: ['Mobile', 'Admin-web', 'Business-web'],
    can: [
      'Модерация заведений во всех городах',
      'VIP / Топ в любом городе',
      'Список пользователей и смена ролей',
      'Категории каталога (создание / правки)',
      'Черновики подборок для любого города',
      'Кабинет бизнеса и аналитика',
    ],
    cannot: [
      'Прямой доступ к БД и секретам',
      'Автопубликация контента без проверки редактора',
    ],
  },
};

export function getRoleDefinition(role: string): RoleDefinition {
  const key = role as UserRole;
  return ROLE_DEFINITIONS[key] ?? ROLE_DEFINITIONS[UserRole.USER];
}

export function canModerate(role: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.CITY_ADMIN;
}

export function canManageUsers(role: string): boolean {
  return role === UserRole.ADMIN;
}

export function canManageBusinessCabinet(role: string): boolean {
  return (
    role === UserRole.BUSINESS ||
    role === UserRole.ADMIN ||
    role === UserRole.CITY_ADMIN
  );
}

export function canAccessAdminWeb(role: string): boolean {
  return canModerate(role);
}

export function canAccessBusinessWeb(role: string): boolean {
  return canManageBusinessCabinet(role);
}
