export type ReviewTargetState =
  | 'MISSING'
  | 'ACTIVE'
  | 'MODERATION_HIDDEN'
  | 'USER_SOFT_DELETED';

export function reviewTargetStateLabel(state: ReviewTargetState): string {
  switch (state) {
    case 'MISSING':
      return 'Объект недоступен (удалён)';
    case 'ACTIVE':
      return 'Активен';
    case 'MODERATION_HIDDEN':
      return 'Скрыт модерацией';
    case 'USER_SOFT_DELETED':
      return 'Удалён автором';
    default:
      return state;
  }
}

export function reviewPublicVisibilityLabel(publiclyVisible: boolean | undefined): string {
  return publiclyVisible ? 'Виден публично' : 'Не виден публично';
}
