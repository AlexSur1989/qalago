import { UserRole } from './index';

export interface RoleDefinition {
  role: UserRole;
  labelRu: string;
  summaryRu: string;
  can: string[];
  cannot: string[];
  apps: string[];
}

const staffApp = ['Admin-web'];

function staffDef(
  role: UserRole,
  labelRu: string,
  summaryRu: string,
): RoleDefinition {
  return {
    role,
    labelRu,
    summaryRu,
    apps: staffApp,
    can: ['Доступ к admin-web по матрице прав Stage 6.9.1'],
    cannot: ['Действия вне назначенных permissions'],
  };
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
  [UserRole.CITY_ADMIN]: staffDef(
    UserRole.CITY_ADMIN,
    'Администратор города',
    'Операции только в назначенных городах.',
  ),
  [UserRole.ADMIN]: staffDef(
    UserRole.ADMIN,
    'Администратор',
    'Глобальный операционный администратор.',
  ),
  [UserRole.SUPER_ADMIN]: staffDef(
    UserRole.SUPER_ADMIN,
    'Суперадминистратор',
    'Полное управление платформой и staff.',
  ),
  [UserRole.MODERATOR]: staffDef(UserRole.MODERATOR, 'Модератор', 'Контент и безопасность.'),
  [UserRole.SALES_MANAGER]: staffDef(
    UserRole.SALES_MANAGER,
    'Менеджер продаж',
    'Коммерческие операции без подтверждения оплат.',
  ),
  [UserRole.CONTENT_MANAGER]: staffDef(
    UserRole.CONTENT_MANAGER,
    'Контент-менеджер',
    'Каталог и контент без смены владельца.',
  ),
  [UserRole.FINANCE]: staffDef(UserRole.FINANCE, 'Финансы', 'Заказы и подтверждение оплат.'),
  [UserRole.SUPPORT]: staffDef(UserRole.SUPPORT, 'Поддержка', 'Триаж обращений без эскалации прав.'),
  [UserRole.ANALYST]: staffDef(UserRole.ANALYST, 'Аналитик', 'Только чтение отчётов.'),
  [UserRole.TECH_ADMIN]: staffDef(
    UserRole.TECH_ADMIN,
    'Тех. администратор',
    'Release/feature flags без доступа к PII.',
  ),
};

export function getRoleDefinition(role: string): RoleDefinition {
  const key = role as UserRole;
  return ROLE_DEFINITIONS[key] ?? ROLE_DEFINITIONS[UserRole.USER];
}
