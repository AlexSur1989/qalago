String applicationStatusLabel(String status) {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

String claimStatusLabel(String status) {
  switch (status) {
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

String membershipRoleLabel(String role) {
  switch (role) {
    case 'OWNER':
      return 'Владелец';
    case 'MANAGER':
      return 'Менеджер';
    default:
      return role;
  }
}
