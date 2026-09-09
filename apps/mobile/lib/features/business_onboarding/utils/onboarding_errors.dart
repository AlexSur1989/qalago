String mapOnboardingError(Object error) {
  final raw = error.toString();
  final lower = raw.toLowerCase();
  if (raw.contains('409') || lower.contains('conflict') || lower.contains('pending')) {
    return 'Заявка уже отправлена или статус изменился. Обновите страницу.';
  }
  if (lower.contains('duplicate') || lower.contains('already exists')) {
    return 'Похожий бизнес уже есть в QalaGo. Попробуйте найти существующий.';
  }
  if (lower.contains('already an active owner') || lower.contains('already have')) {
    return 'У вас уже есть права владельца этого бизнеса.';
  }
  if (lower.contains('suspended') || lower.contains('revoked')) {
    return 'Доступ ограничен. Обратитесь к администратору.';
  }
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}
