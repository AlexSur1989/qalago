class RolePermissionItem {
  const RolePermissionItem(this.text);

  final String text;
}

class RoleDefinition {
  const RoleDefinition({
    required this.role,
    required this.labelRu,
    required this.summaryRu,
    required this.apps,
    required this.can,
    required this.cannot,
  });

  final String role;
  final String labelRu;
  final String summaryRu;
  final List<String> apps;
  final List<RolePermissionItem> can;
  final List<RolePermissionItem> cannot;
}

const kRoleDefinitions = <String, RoleDefinition>{
  'USER': RoleDefinition(
    role: 'USER',
    labelRu: 'Житель',
    summaryRu: 'Обычный пользователь приложения.',
    apps: ['Mobile'],
    can: [
      RolePermissionItem('Смотреть каталог, карту и акции'),
      RolePermissionItem('Добавлять заведения в избранное'),
      RolePermissionItem('Оставлять отзывы'),
      RolePermissionItem('Редактировать профиль и город'),
      RolePermissionItem('Подать заявку на добавление заведения'),
    ],
    cannot: [
      RolePermissionItem('Модерировать чужие заведения'),
      RolePermissionItem('Редактировать чужие профили бизнеса'),
      RolePermissionItem('Назначать VIP / Топ'),
      RolePermissionItem('Управлять пользователями'),
      RolePermissionItem('Вход в admin-web'),
    ],
  ),
  'BUSINESS': RoleDefinition(
    role: 'BUSINESS',
    labelRu: 'Владелец бизнеса',
    summaryRu: 'Владелец одного или нескольких заведений.',
    apps: ['Mobile', 'Business-web'],
    can: [
      RolePermissionItem('Всё, что доступно жителю'),
      RolePermissionItem('Кабинет: профиль, меню, галерея'),
      RolePermissionItem('Акции и статистика своих заведений'),
      RolePermissionItem('Ответы на отзывы клиентов'),
    ],
    cannot: [
      RolePermissionItem('Модерировать чужие заявки'),
      RolePermissionItem('Редактировать чужие заведения'),
      RolePermissionItem('Менять VIP / статус публикации'),
      RolePermissionItem('Управлять пользователями'),
      RolePermissionItem('Вход в admin-web'),
    ],
  ),
  'CITY_ADMIN': RoleDefinition(
    role: 'CITY_ADMIN',
    labelRu: 'Модератор города',
    summaryRu: 'Администратор одного города.',
    apps: ['Mobile', 'Admin-web'],
    can: [
      RolePermissionItem('Модерация заведений своего города'),
      RolePermissionItem('Одобрение / блокировка заявок'),
      RolePermissionItem('VIP / Топ в своём городе'),
      RolePermissionItem('Черновики подборок (admin-web)'),
      RolePermissionItem('Кабинет бизнеса при наличии заведений'),
    ],
    cannot: [
      RolePermissionItem('Модерировать другие города'),
      RolePermissionItem('Менять роли пользователей'),
      RolePermissionItem('Список всех пользователей'),
      RolePermissionItem('Переключать город модерации'),
    ],
  ),
  'ADMIN': RoleDefinition(
    role: 'ADMIN',
    labelRu: 'Администратор платформы',
    summaryRu: 'Полный доступ к модерации MVP.',
    apps: ['Mobile', 'Admin-web', 'Business-web'],
    can: [
      RolePermissionItem('Модерация во всех городах'),
      RolePermissionItem('VIP / Топ в любом городе'),
      RolePermissionItem('Пользователи и смена ролей'),
      RolePermissionItem('Категории каталога'),
      RolePermissionItem('Черновики для любого города'),
      RolePermissionItem('Кабинет бизнеса и аналитика'),
    ],
    cannot: [
      RolePermissionItem('Прямой доступ к БД'),
      RolePermissionItem('Автопубликация без редактора'),
    ],
  ),
};

RoleDefinition roleDefinitionFor(String role) =>
    kRoleDefinitions[role] ?? kRoleDefinitions['USER']!;

bool canModerate(String? role) =>
    role == 'ADMIN' || role == 'CITY_ADMIN';

bool canManageUsers(String? role) => role == 'ADMIN';

bool canManageBusinessCabinet(String? role) =>
    role == 'BUSINESS' || role == 'ADMIN' || role == 'CITY_ADMIN';

String profileRoleLabel(String role) => roleDefinitionFor(role).labelRu;
