String profileRoleLabel(String role) {
  switch (role) {
    case 'BUSINESS':
      return 'Бизнес';
    case 'CITY_ADMIN':
      return 'Модератор города';
    case 'ADMIN':
      return 'Администратор';
    default:
      return 'Житель';
  }
}
